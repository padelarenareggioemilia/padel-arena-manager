-- PADEL ARENA MANAGER V8.2.38.33
-- Stabilizzazione Campionati Nazionali e accessi limitati al singolo evento.
-- Non elimina tornei, iscrizioni, giocatori, partite o risultati.

create extension if not exists pgcrypto;
create schema if not exists private;

-- Le tre categorie operative non devono comparire come tornei autonomi nelle
-- pagine pubbliche. Le versioni precedenti usavano "internal", ma il vecchio
-- vincolo della tabella rifiutava quel valore e annullava il loro salvataggio.
alter table public.tournaments drop constraint if exists tournaments_status_check;
alter table public.tournaments add constraint tournaments_status_check check(status in(
 'draft','published','active','registration_open','registration_closed','completed','archived','cancelled','internal'
));

create table if not exists public.tournament_access(
 user_id uuid not null references auth.users(id) on delete cascade,
 tournament_id text not null references public.tournaments(id) on delete cascade,
 access_role text not null default 'collaborator' check(access_role in('collaborator')),
 can_manage_results boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,tournament_id)
);

create table if not exists public.collaborator_invites(
 id uuid primary key default gen_random_uuid(),
 token text not null unique default gen_random_uuid()::text,
 tournament_id text not null references public.tournaments(id) on delete cascade,
 active boolean not null default true,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz
);

create table if not exists public.player_event_access(
 user_id uuid not null references auth.users(id) on delete cascade,
 tournament_id text not null references public.tournaments(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,tournament_id)
);

create index if not exists tournament_access_user_idx on public.tournament_access(user_id);
create index if not exists player_event_access_user_idx on public.player_event_access(user_id);
create index if not exists collaborator_invites_token_idx on public.collaborator_invites(token);

alter table public.tournament_access enable row level security;
alter table public.collaborator_invites enable row level security;
alter table public.player_event_access enable row level security;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select (select auth.uid()) is not null and exists(
  select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'
 )
$$;

create or replace function private.has_tournament_access(p_tournament_id text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select (select auth.uid()) is not null and exists(
  select 1
  from public.tournament_access a
  where a.user_id=(select auth.uid())
   and (
    a.tournament_id=p_tournament_id
    or exists(
     select 1 from public.tournaments t
     where t.id=p_tournament_id and t.data->>'nationalParentId'=a.tournament_id
    )
   )
 )
$$;

create or replace function private.can_see_player(p_player_id text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select (select auth.uid()) is not null and exists(
  select 1
  from public.tournament_access a
  join public.tournaments t
   on t.id=a.tournament_id or t.data->>'nationalParentId'=a.tournament_id
  where a.user_id=(select auth.uid())
   and coalesce(t.data->'playerIds','[]'::jsonb) ? p_player_id
 )
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.has_tournament_access(text) from public;
revoke all on function private.can_see_player(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin(),private.has_tournament_access(text),private.can_see_player(text) to authenticated;

-- I nuovi account nascono Free. Diventano giocatori o collaboratori solo dopo
-- aver riscattato il rispettivo invito personale.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.profiles(id,email,role,display_name)
 values(
  new.id,
  new.email,
  case when lower(new.email)='padelarenareggioemilia@gmail.com' then 'admin' else 'free' end,
  coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))
 )
 on conflict(id) do update set
  email=excluded.email,
  role=case when lower(excluded.email)='padelarenareggioemilia@gmail.com' then 'admin' else public.profiles.role end,
  display_name=coalesce(public.profiles.display_name,excluded.display_name),
  updated_at=now();
 return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute function public.handle_new_user();

-- Politiche degli accessi.
drop policy if exists tournament_access_admin on public.tournament_access;
drop policy if exists tournament_access_own on public.tournament_access;
create policy tournament_access_admin on public.tournament_access for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
create policy tournament_access_own on public.tournament_access for select to authenticated
 using(user_id=(select auth.uid()));

drop policy if exists collaborator_invites_admin on public.collaborator_invites;
create policy collaborator_invites_admin on public.collaborator_invites for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));

drop policy if exists player_event_access_admin on public.player_event_access;
drop policy if exists player_event_access_own on public.player_event_access;
create policy player_event_access_admin on public.player_event_access for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
create policy player_event_access_own on public.player_event_access for select to authenticated
 using(user_id=(select auth.uid()));

-- Anagrafiche: admin completo, collaboratore solo giocatori del torneo assegnato,
-- giocatore esclusivamente la propria scheda.
drop policy if exists players_auth on public.players;
drop policy if exists players_staff_all on public.players;
drop policy if exists players_admin_all on public.players;
drop policy if exists players_collaborator_select on public.players;
drop policy if exists players_player_select on public.players;
drop policy if exists players_player_update on public.players;
create policy players_admin_all on public.players for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
create policy players_collaborator_select on public.players for select to authenticated
 using((select private.can_see_player(id)));
create policy players_player_select on public.players for select to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=(select auth.uid()) and a.player_id=id));
create policy players_player_update on public.players for update to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=(select auth.uid()) and a.player_id=id))
 with check(exists(select 1 from public.player_accounts a where a.user_id=(select auth.uid()) and a.player_id=id));

-- Tornei: il collaboratore può leggere e aggiornare soltanto gli eventi assegnati.
-- L'accesso al padre nazionale comprende automaticamente i tre figli interni.
drop policy if exists tournaments_auth on public.tournaments;
drop policy if exists tournaments_staff_all on public.tournaments;
drop policy if exists tournaments_admin_all on public.tournaments;
drop policy if exists tournaments_collaborator_select on public.tournaments;
drop policy if exists tournaments_collaborator_update on public.tournaments;
drop policy if exists tournaments_player_select on public.tournaments;
create policy tournaments_admin_all on public.tournaments for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
create policy tournaments_collaborator_select on public.tournaments for select to authenticated
 using((select private.has_tournament_access(id)));
create policy tournaments_collaborator_update on public.tournaments for update to authenticated
 using((select private.has_tournament_access(id)))
 with check((select private.has_tournament_access(id)));

-- Iscrizioni: collaboratore soltanto sul torneo assegnato; giocatore soltanto la propria.
drop policy if exists registrations_auth on public.public_registrations;
drop policy if exists registrations_staff_all on public.public_registrations;
drop policy if exists registrations_admin_all on public.public_registrations;
drop policy if exists registrations_collaborator_select on public.public_registrations;
drop policy if exists registrations_collaborator_update on public.public_registrations;
drop policy if exists registrations_player_select on public.public_registrations;
create policy registrations_admin_all on public.public_registrations for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
create policy registrations_collaborator_select on public.public_registrations for select to authenticated
 using((select private.has_tournament_access(tournament_id)));
create policy registrations_collaborator_update on public.public_registrations for update to authenticated
 using((select private.has_tournament_access(tournament_id)))
 with check((select private.has_tournament_access(tournament_id)));
create policy registrations_player_select on public.public_registrations for select to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=(select auth.uid()) and a.player_id in(primary_player_id,partner_player_id)));

-- Inviti e account giocatore restano amministrabili solo dall'admin o dal proprietario.
drop policy if exists player_invites_admin on public.player_invites;
create policy player_invites_admin on public.player_invites for all to authenticated
 using((select private.is_admin())) with check((select private.is_admin()));
drop policy if exists player_accounts_own on public.player_accounts;
create policy player_accounts_own on public.player_accounts for select to authenticated
 using(user_id=(select auth.uid()));

create or replace function public.admin_create_collaborator_invite(p_tournament_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.collaborator_invites; t public.tournaments;
begin
 if not private.is_admin() then raise exception 'Operazione riservata all’amministratore'; end if;
 select * into t from public.tournaments where id=p_tournament_id and coalesce(status,'published')<>'internal';
 if not found then raise exception 'Evento principale non trovato'; end if;
 insert into public.collaborator_invites(tournament_id,created_by)
 values(t.id,(select auth.uid())) returning * into r;
 return jsonb_build_object('token',r.token,'tournament_id',t.id,'event_name',coalesce(t.name,t.data->>'name'));
end$$;

create or replace function public.public_collaborator_invite(p_token text)
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object(
  'tournament_id',i.tournament_id,'event_name',coalesce(t.name,t.data->>'name'),
  'event_date',coalesce(t.event_date::text,t.data->>'date'),'club',coalesce(t.club,t.data->>'club')
 )
 from public.collaborator_invites i join public.tournaments t on t.id=i.tournament_id
 where i.token=p_token and i.active=true and (i.expires_at is null or i.expires_at>now()) limit 1
$$;

create or replace function public.claim_collaborator_invite(p_token text,p_display_name text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.collaborator_invites; t public.tournaments; em text; current_role text;
begin
 if (select auth.uid()) is null then raise exception 'Conferma l’email o accedi prima di continuare'; end if;
 select role into current_role from public.profiles where id=(select auth.uid());
 if current_role='admin' then raise exception 'L’amministratore non deve riscattare un invito collaboratore'; end if;
 select * into i from public.collaborator_invites where token=p_token and active=true and (expires_at is null or expires_at>now());
 if not found then raise exception 'Invito non valido o non più attivo'; end if;
 select * into t from public.tournaments where id=i.tournament_id;
 if not found then raise exception 'Torneo assegnato non trovato'; end if;
 select lower(email) into em from auth.users where id=(select auth.uid());
 insert into public.tournament_access(user_id,tournament_id,access_role,can_manage_results)
 values((select auth.uid()),i.tournament_id,'collaborator',true)
 on conflict(user_id,tournament_id) do update set can_manage_results=true,updated_at=now();
 insert into public.profiles(id,email,role,display_name)
 values((select auth.uid()),em,'collaborator',coalesce(nullif(trim(p_display_name),''),split_part(em,'@',1)))
 on conflict(id) do update set role='collaborator',email=excluded.email,
  display_name=coalesce(nullif(excluded.display_name,''),public.profiles.display_name),updated_at=now();
 return jsonb_build_object('tournament_id',t.id,'event_name',coalesce(t.name,t.data->>'name'),'share_token',t.share_token);
end$$;

-- Gli inviti giocatore possono accumulare più eventi senza perdere quelli precedenti.
create or replace function public.claim_player_invite(p_token text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.player_invites; pid text; existing public.player_accounts; em text;
begin
 if (select auth.uid()) is null then raise exception 'Conferma l’email o accedi prima di continuare'; end if;
 select * into i from public.player_invites where token=p_token and active=true and (expires_at is null or expires_at>now());
 if not found then raise exception 'Invito non valido o non più attivo'; end if;
 select * into existing from public.player_accounts where user_id=(select auth.uid());
 select lower(email) into em from auth.users where id=(select auth.uid());
 if existing.user_id is not null then
  pid=existing.player_id;
  update public.players set data=coalesce(data,'{}'::jsonb)||p_payload||jsonb_build_object('email',em),updated_at=now() where id=pid;
  update public.player_accounts set
   access_scope=case when access_scope='platform' or i.access_scope='platform' then 'platform' else 'event' end,
   tournament_id=case when i.access_scope='event' then i.tournament_id else tournament_id end,
   updated_at=now() where user_id=(select auth.uid());
 else
  pid='p_'||gen_random_uuid()::text;
  insert into public.players(id,data) values(pid,p_payload||jsonb_build_object('email',em));
  insert into public.player_accounts(user_id,player_id,access_scope,tournament_id)
  values((select auth.uid()),pid,i.access_scope,i.tournament_id);
 end if;
 if i.access_scope='event' then
  insert into public.player_event_access(user_id,tournament_id) values((select auth.uid()),i.tournament_id)
  on conflict(user_id,tournament_id) do nothing;
 end if;
 insert into public.profiles(id,email,role,display_name)
 values((select auth.uid()),em,'player',trim(coalesce(p_payload->>'firstName','')||' '||coalesce(p_payload->>'lastName','')))
 on conflict(id) do update set role='player',display_name=excluded.display_name,email=excluded.email,updated_at=now();
 return jsonb_build_object('player_id',pid,'scope',i.access_scope,'tournament_id',i.tournament_id);
end$$;

create or replace function public.player_my_account()
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('player_id',a.player_id,'scope',a.access_scope,'tournament_id',a.tournament_id,'profile',p.data)
 from public.player_accounts a join public.players p on p.id=a.player_id
 where a.user_id=(select auth.uid()) limit 1
$$;

create or replace function public.player_visible_tournaments()
returns table(id text,name text,event_date date,club text,category text,competition_type text,share_token text)
language sql security definer set search_path=public,pg_temp as $$
 select t.id,coalesce(t.name,t.data->>'name'),coalesce(t.event_date,(t.data->>'date')::date),
  coalesce(t.club,t.data->>'club'),coalesce(t.category,t.data->>'category'),
  coalesce(t.competition_type,t.data->>'competitionType'),t.share_token
 from public.tournaments t
 join public.player_accounts a on a.user_id=(select auth.uid())
 where coalesce(t.status,'published') not in('draft','archived','cancelled','internal')
  and (
   a.access_scope='platform'
   or exists(select 1 from public.player_event_access x where x.user_id=(select auth.uid()) and x.tournament_id=t.id)
  )
 order by 3 desc nulls last
$$;

-- Categoria normalizzata delle iscrizioni nazionali.
create or replace function private.registration_national_category(p_payload jsonb)
returns text language sql immutable set search_path=pg_catalog as $$
 select case
  when lower(coalesce(p_payload->'data'->>'nationalCategory',p_payload->>'nationalCategory',p_payload->'data'->>'category',p_payload->>'category','')) like '%femmin%' then 'Femminile'
  when lower(coalesce(p_payload->'data'->>'nationalCategory',p_payload->>'nationalCategory',p_payload->'data'->>'category',p_payload->>'category','')) like '%mist%' then 'Misto'
  when lower(coalesce(p_payload->'data'->>'nationalCategory',p_payload->>'nationalCategory',p_payload->'data'->>'category',p_payload->>'category','')) like '%masch%' then 'Maschile'
  else '' end
$$;

create or replace function private.repair_national_event(p_parent_id text)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
declare
 parent_row public.tournaments;
 child_row public.tournaments;
 category_name text;
 child_id text;
 child_ids text[]='{}';
 participant_ids jsonb;
 pair_links jsonb;
 snapshots jsonb;
 pair_count integer;
 summary jsonb='{}'::jsonb;
begin
 select * into parent_row from public.tournaments where id=p_parent_id and competition_type='national_event' for update;
 if not found then raise exception 'Evento nazionale non trovato'; end if;

 foreach category_name in array array['Maschile','Femminile','Misto'] loop
  select * into child_row from public.tournaments
  where data->>'nationalParentId'=p_parent_id and data->>'nationalCategory'=category_name
  order by updated_at desc limit 1;

  if child_row.id is null then
   child_id='nat_'||substr(md5(p_parent_id||':'||lower(category_name)),1,24);
   insert into public.tournaments(id,name,event_date,club,category,competition_type,logo_url,status,data)
   values(
    child_id,
    coalesce(parent_row.name,parent_row.data->>'name','Campionati Nazionali')||' · '||category_name,
    parent_row.event_date,
    parent_row.club,
    category_name,
    'fixed_pairs',
    parent_row.logo_url,
    'internal',
    (parent_row.data-'nationalChildIds'-'nationalSchedule'-'playerIds'-'playerSnapshots'-'fixedPairRegistrations'-'pairs'-'matches'-'payments'-'ledger'-'timers')
     ||jsonb_build_object(
      'id',child_id,'name',coalesce(parent_row.name,parent_row.data->>'name','Campionati Nazionali')||' · '||category_name,
      'category',category_name,'competitionType','fixed_pairs','status','internal','registrationOpen',false,
      'nationalParentId',p_parent_id,'nationalCategory',category_name,
      'playerIds','[]'::jsonb,'playerSnapshots','{}'::jsonb,'fixedPairRegistrations','{}'::jsonb,
      'pairs','[]'::jsonb,'matches','[]'::jsonb,'payments','{}'::jsonb,'ledger','{}'::jsonb,'timers','{}'::jsonb
     )
   ) returning * into child_row;
  else
   child_id=child_row.id;
  end if;

  with valid_pairs as(
   select primary_player_id a,partner_player_id b
   from public.public_registrations
   where tournament_id=p_parent_id and status in('accepted','imported')
    and private.registration_national_category(primary_payload)=category_name
    and primary_player_id is not null and partner_player_id is not null and primary_player_id<>partner_player_id
  ), unique_ids as(
   select a id from valid_pairs union select b from valid_pairs
  )
  select coalesce(jsonb_agg(id order by id),'[]'::jsonb) into participant_ids from unique_ids;

  with valid_pairs as(
   select primary_player_id a,partner_player_id b
   from public.public_registrations
   where tournament_id=p_parent_id and status in('accepted','imported')
    and private.registration_national_category(primary_payload)=category_name
    and primary_player_id is not null and partner_player_id is not null and primary_player_id<>partner_player_id
  ), directed as(
   select a id,b partner from valid_pairs union all select b,a from valid_pairs
  )
  select coalesce(jsonb_object_agg(id,jsonb_build_object('mode','pair','partnerId',partner)),'{}'::jsonb)
  into pair_links from directed;

  select coalesce(jsonb_object_agg(p.id,jsonb_build_object(
   'id',p.id,'firstName',coalesce(p.data->>'firstName',''),'lastName',coalesce(p.data->>'lastName',''),
   'phone',coalesce(p.data->>'phone',''),'email',coalesce(p.data->>'email',''),
   'gender',coalesce(p.data->>'gender',''),'level',coalesce(p.data->>'level',''),'photoUrl',coalesce(p.photo_url,p.data->>'photoUrl','')
  )),'{}'::jsonb) into snapshots
  from public.players p where p.id in(select jsonb_array_elements_text(participant_ids));

  select count(*) into pair_count from public.public_registrations
  where tournament_id=p_parent_id and status in('accepted','imported')
   and private.registration_national_category(primary_payload)=category_name
   and primary_player_id is not null and partner_player_id is not null and primary_player_id<>partner_player_id;

  update public.tournaments set
   name=coalesce(parent_row.name,parent_row.data->>'name','Campionati Nazionali')||' · '||category_name,
   event_date=parent_row.event_date,club=parent_row.club,category=category_name,
   competition_type='fixed_pairs',logo_url=parent_row.logo_url,status='internal',
   data=data||jsonb_build_object(
    'id',child_id,'name',coalesce(parent_row.name,parent_row.data->>'name','Campionati Nazionali')||' · '||category_name,
    'category',category_name,'competitionType','fixed_pairs','status','internal','registrationOpen',false,
    'nationalParentId',p_parent_id,'nationalCategory',category_name,
    'playerIds',participant_ids,'playerSnapshots',snapshots,'fixedPairRegistrations',pair_links,
    'nationalConfirmedPairCount',pair_count,'nationalStructureVersion',823833
   ),updated_at=now()
  where id=child_id;

  child_ids=array_append(child_ids,child_id);
  summary=summary||jsonb_build_object(category_name,pair_count);
  child_row=null;
 end loop;

 update public.tournaments set
  data=data||jsonb_build_object('nationalChildIds',to_jsonb(child_ids),'nationalStructureVersion',823833),
  updated_at=now()
 where id=p_parent_id;

 return jsonb_build_object('ok',true,'parent_id',p_parent_id,'child_ids',to_jsonb(child_ids),'categories',summary);
end$$;

create or replace function public.admin_repair_national_event(p_parent_id text)
returns jsonb language plpgsql security definer set search_path=public,private,pg_temp as $$
begin
 if not private.is_admin() then raise exception 'Operazione riservata all’amministratore'; end if;
 return private.repair_national_event(p_parent_id);
end$$;

-- Riallineamento iniziale non distruttivo di tutti gli eventi nazionali già presenti.
do $$
declare r record;
begin
 for r in select id from public.tournaments where competition_type='national_event' loop
  perform private.repair_national_event(r.id);
 end loop;
end$$;

create unique index if not exists tournaments_national_child_unique
on public.tournaments((data->>'nationalParentId'),(data->>'nationalCategory'))
where coalesce(data->>'nationalParentId','')<>'' and coalesce(data->>'nationalCategory','')<>'';

grant select on public.tournament_access,public.player_event_access to authenticated;
grant select,insert,update,delete on public.collaborator_invites to authenticated;
revoke all on function public.admin_create_collaborator_invite(text) from public;
revoke all on function public.public_collaborator_invite(text) from public;
revoke all on function public.claim_collaborator_invite(text,text) from public;
revoke all on function public.admin_repair_national_event(text) from public;
revoke all on function private.registration_national_category(jsonb) from public;
revoke all on function private.repair_national_event(text) from public;
grant execute on function public.admin_create_collaborator_invite(text),public.claim_collaborator_invite(text,text),public.admin_repair_national_event(text) to authenticated;
grant execute on function public.public_collaborator_invite(text) to anon,authenticated;
grant execute on function private.registration_national_category(jsonb) to authenticated;
grant execute on function public.claim_player_invite(text,jsonb),public.player_my_account(),public.player_visible_tournaments() to authenticated;

notify pgrst,'reload schema';

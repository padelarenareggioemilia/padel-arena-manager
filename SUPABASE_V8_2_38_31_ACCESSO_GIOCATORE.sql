-- PADEL ARENA MANAGER V8.2.38.31
-- Inviti giocatore: accesso a un singolo evento oppure all'intera area pubblica.
-- Eseguire una sola volta in Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

create table if not exists public.player_invites(
 id uuid primary key default gen_random_uuid(),
 token text not null unique default gen_random_uuid()::text,
 access_scope text not null check(access_scope in ('event','platform')),
 tournament_id text references public.tournaments(id) on delete cascade,
 active boolean not null default true,
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz
);

create table if not exists public.player_accounts(
 user_id uuid primary key references auth.users(id) on delete cascade,
 player_id text not null unique references public.players(id) on delete cascade,
 access_scope text not null check(access_scope in ('event','platform')),
 tournament_id text references public.tournaments(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.player_invites enable row level security;
alter table public.player_accounts enable row level security;

-- Sostituisce le vecchie regole troppo ampie per gli utenti autenticati:
-- amministratore/collaboratore conservano il lavoro completo, il giocatore vede solo il proprio perimetro.
drop policy if exists players_auth on public.players;
drop policy if exists players_staff_all on public.players;
drop policy if exists players_player_select on public.players;
drop policy if exists players_player_update on public.players;
create policy players_staff_all on public.players for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')))
 with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')));
create policy players_player_select on public.players for select to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=auth.uid() and a.player_id=id));
create policy players_player_update on public.players for update to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=auth.uid() and a.player_id=id))
 with check(exists(select 1 from public.player_accounts a where a.user_id=auth.uid() and a.player_id=id));

drop policy if exists tournaments_auth on public.tournaments;
drop policy if exists tournaments_staff_all on public.tournaments;
drop policy if exists tournaments_player_select on public.tournaments;
create policy tournaments_staff_all on public.tournaments for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')))
 with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')));
create policy tournaments_player_select on public.tournaments for select to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=auth.uid() and (a.access_scope='platform' or a.tournament_id=id)));

drop policy if exists registrations_auth on public.public_registrations;
drop policy if exists registrations_staff_all on public.public_registrations;
drop policy if exists registrations_player_select on public.public_registrations;
create policy registrations_staff_all on public.public_registrations for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')))
 with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','collaborator')));
create policy registrations_player_select on public.public_registrations for select to authenticated
 using(exists(select 1 from public.player_accounts a where a.user_id=auth.uid() and a.player_id in(primary_player_id,partner_player_id)));

drop policy if exists player_invites_admin on public.player_invites;
create policy player_invites_admin on public.player_invites for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists player_accounts_own on public.player_accounts;
create policy player_accounts_own on public.player_accounts for select to authenticated using(user_id=auth.uid());

create or replace function public.admin_create_player_invite(p_scope text,p_tournament_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.player_invites; t public.tournaments;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
  raise exception 'Operazione riservata all’amministratore';
 end if;
 if p_scope not in('event','platform') then raise exception 'Tipo di invito non valido'; end if;
 if p_scope='event' then
  if p_tournament_id is null then raise exception 'Seleziona un evento'; end if;
  select * into t from public.tournaments where id=p_tournament_id;
  if not found then raise exception 'Evento non trovato'; end if;
 end if;
 insert into public.player_invites(access_scope,tournament_id,created_by)
 values(p_scope,case when p_scope='event' then p_tournament_id else null end,auth.uid()) returning * into r;
 return jsonb_build_object('token',r.token,'scope',r.access_scope,'tournament_id',r.tournament_id,
  'event_name',case when p_scope='event' then coalesce(t.name,t.data->>'name') else null end);
end$$;

create or replace function public.public_player_invite(p_token text)
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('scope',i.access_scope,'tournament_id',i.tournament_id,
  'event_name',coalesce(t.name,t.data->>'name'),'event_date',coalesce(t.event_date::text,t.data->>'date'),
  'club',coalesce(t.club,t.data->>'club'))
 from public.player_invites i left join public.tournaments t on t.id=i.tournament_id
 where i.token=p_token and i.active=true and (i.expires_at is null or i.expires_at>now()) limit 1
$$;

create or replace function public.claim_player_invite(p_token text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare i public.player_invites; pid text; existing public.player_accounts; em text;
begin
 if auth.uid() is null then raise exception 'Conferma l’email o accedi prima di continuare'; end if;
 select * into i from public.player_invites where token=p_token and active=true and (expires_at is null or expires_at>now());
 if not found then raise exception 'Invito non valido o non più attivo'; end if;
 select * into existing from public.player_accounts where user_id=auth.uid();
 select lower(email) into em from auth.users where id=auth.uid();
 if existing.user_id is not null then
  pid=existing.player_id;
  update public.players set data=coalesce(data,'{}'::jsonb)||p_payload||jsonb_build_object('email',em),updated_at=now() where id=pid;
  update public.player_accounts set
   access_scope=case when access_scope='platform' or i.access_scope='platform' then 'platform' else 'event' end,
   tournament_id=case when access_scope='platform' or i.access_scope='platform' then null else i.tournament_id end,
   updated_at=now() where user_id=auth.uid();
 else
  pid='p_'||gen_random_uuid()::text;
  insert into public.players(id,data) values(pid,p_payload||jsonb_build_object('email',em));
  insert into public.player_accounts(user_id,player_id,access_scope,tournament_id)
  values(auth.uid(),pid,i.access_scope,i.tournament_id);
 end if;
 insert into public.profiles(id,email,role,display_name)
 values(auth.uid(),em,'player',trim(coalesce(p_payload->>'firstName','')||' '||coalesce(p_payload->>'lastName','')))
 on conflict(id) do update set role='player',display_name=excluded.display_name,email=excluded.email,updated_at=now();
 return jsonb_build_object('player_id',pid,'scope',i.access_scope,'tournament_id',i.tournament_id);
end$$;

create or replace function public.player_my_account()
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object('player_id',a.player_id,'scope',a.access_scope,'tournament_id',a.tournament_id,
  'profile',p.data,'event',case when t.id is null then null else jsonb_build_object(
   'id',t.id,'name',coalesce(t.name,t.data->>'name'),'date',coalesce(t.event_date::text,t.data->>'date'),
   'club',coalesce(t.club,t.data->>'club'),'category',coalesce(t.category,t.data->>'category'),
   'share_token',t.share_token,'data',t.data) end)
 from public.player_accounts a join public.players p on p.id=a.player_id
 left join public.tournaments t on t.id=a.tournament_id where a.user_id=auth.uid() limit 1
$$;

create or replace function public.player_update_my_profile(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare pid text;
begin
 select player_id into pid from public.player_accounts where user_id=auth.uid();
 if pid is null then raise exception 'Account giocatore non collegato'; end if;
 update public.players set data=coalesce(data,'{}'::jsonb)||p_payload,updated_at=now() where id=pid;
 return jsonb_build_object('ok',true,'player_id',pid);
end$$;

create or replace function public.player_visible_tournaments()
returns table(id text,name text,event_date date,club text,category text,competition_type text,share_token text)
language sql security definer set search_path=public as $$
 select t.id,coalesce(t.name,t.data->>'name'),coalesce(t.event_date,(t.data->>'date')::date),
  coalesce(t.club,t.data->>'club'),coalesce(t.category,t.data->>'category'),
  coalesce(t.competition_type,t.data->>'competitionType'),t.share_token
 from public.tournaments t join public.player_accounts a on a.user_id=auth.uid()
 where t.status not in('draft','archived','cancelled') and (a.access_scope='platform' or t.id=a.tournament_id)
 order by 3 desc nulls last
$$;

grant select,insert,update,delete on public.player_invites to authenticated;
grant select on public.player_accounts to authenticated;
grant execute on function public.admin_create_player_invite(text,text) to authenticated;
grant execute on function public.public_player_invite(text) to anon,authenticated;
grant execute on function public.claim_player_invite(text,jsonb),public.player_my_account(),public.player_update_my_profile(jsonb),public.player_visible_tournaments() to authenticated;
notify pgrst,'reload schema';

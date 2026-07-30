-- PADEL ARENA MANAGER 4.3.1
-- SCRIPT COMPATIBILE CON IL DATABASE ATTUALE:
-- tournaments.id = TEXT
-- players.id = TEXT
--
-- Eseguire in Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

drop table if exists public.public_registrations cascade;

create table public.public_registrations (
  id text primary key default gen_random_uuid()::text,
  tournament_id text not null references public.tournaments(id) on delete cascade,
  mode text not null check (mode in ('single','pair')),
  primary_payload jsonb not null,
  partner_payload jsonb,
  primary_player_id text references public.players(id),
  partner_player_id text references public.players(id),
  status text not null default 'new'
    check (status in ('new','accepted','rejected','waitlist','imported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index public_registrations_tournament_idx
on public.public_registrations(tournament_id, created_at asc);

alter table public.public_registrations enable row level security;

create policy "authenticated read registrations"
on public.public_registrations for select
to authenticated
using (true);

create policy "authenticated update registrations"
on public.public_registrations for update
to authenticated
using (true)
with check (true);

revoke all on public.public_registrations from anon;
grant select, update on public.public_registrations to authenticated;

create or replace function public.public_tournament_for_registration(p_share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tournaments;
  d jsonb;
  accepted_count integer;
  capacity integer;
begin
  select * into t
  from public.tournaments
  where share_token::text = p_share_token
    and coalesce(status,'active') <> 'cancelled'
  limit 1;

  if t.id is null then
    raise exception 'Torneo non trovato o link non valido.';
  end if;

  d := coalesce(t.data,'{}'::jsonb);
  capacity := nullif(d->>'registrationCapacity','')::integer;

  select count(*) into accepted_count
  from public.public_registrations
  where tournament_id=t.id and status in ('accepted','imported');

  return jsonb_build_object(
    'id',t.id,
    'name',coalesce(t.name,d->>'name','Torneo'),
    'date',coalesce(t.event_date::text,d->>'date',''),
    'club',coalesce(t.club,d->>'club',''),
    'category',coalesce(t.category,d->>'category',''),
    'competitionType',coalesce(t.competition_type,d->>'competitionType',''),
    'address',coalesce(d->>'customAddress',''),
    'capacity',capacity,
    'acceptedCount',accepted_count,
    'full',case when capacity is null then false else accepted_count >= capacity end,
    'accent','#9DFF25'
  );
end;
$$;

create or replace function public.public_search_players_for_registration(
  p_share_token text,
  p_query text
)
returns table(id text, full_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_query,''))) < 2 then return; end if;

  if not exists (
    select 1 from public.tournaments
    where share_token::text=p_share_token
      and coalesce(status,'active') <> 'cancelled'
  ) then
    raise exception 'Link torneo non valido.';
  end if;

  return query
  select p.id::text,
         trim(coalesce(p.data->>'firstName','') || ' ' || coalesce(p.data->>'lastName','')) as full_name
  from public.players p
  where lower(
    coalesce(p.data->>'firstName','') || ' ' ||
    coalesce(p.data->>'lastName','') || ' ' ||
    coalesce(p.data->>'lastName','') || ' ' ||
    coalesce(p.data->>'firstName','')
  ) like '%' || lower(trim(p_query)) || '%'
  order by coalesce(p.data->>'lastName',''),coalesce(p.data->>'firstName','')
  limit 20;
end;
$$;

create or replace function public.public_submit_tournament_registration_request(
  p_share_token text,
  p_mode text,
  p_primary jsonb,
  p_partner jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament text;
  v_data jsonb;
  v_capacity integer;
  v_accepted integer;
  v_status text := 'new';
  v_existing_primary text;
  v_existing_partner text;
begin
  if p_mode not in ('single','pair') then
    raise exception 'Modalità di iscrizione non valida.';
  end if;

  select id::text,coalesce(data,'{}'::jsonb)
  into v_tournament,v_data
  from public.tournaments
  where share_token::text=p_share_token
    and coalesce(status,'active') <> 'cancelled'
  limit 1;

  if v_tournament is null then
    raise exception 'Torneo non trovato o iscrizioni non disponibili.';
  end if;

  if p_mode='pair' and p_partner is null then
    raise exception 'Indica il partner.';
  end if;

  if p_primary->>'kind'='existing' then
    v_existing_primary := nullif(p_primary->>'player_id','');
    if v_existing_primary is null or not exists(select 1 from public.players where id::text=v_existing_primary) then
      raise exception 'Giocatore selezionato non valido.';
    end if;
  else
    if nullif(trim(p_primary#>>'{data,firstName}'),'') is null
       or nullif(trim(p_primary#>>'{data,lastName}'),'') is null
       or nullif(trim(p_primary#>>'{data,birth}'),'') is null
       or nullif(trim(p_primary#>>'{data,birthPlace}'),'') is null
       or nullif(trim(p_primary#>>'{data,postalCode}'),'') is null
       or nullif(trim(p_primary#>>'{data,residenceTown}'),'') is null
       or nullif(trim(p_primary#>>'{data,residenceProvince}'),'') is null
       or nullif(trim(p_primary#>>'{data,phone}'),'') is null
       or nullif(trim(p_primary#>>'{data,email}'),'') is null then
      raise exception 'Mancano uno o più dati obbligatori.';
    end if;
  end if;

  if p_mode='pair' then
    if p_partner->>'kind'='existing' then
      v_existing_partner := nullif(p_partner->>'player_id','');
      if v_existing_partner is null or not exists(select 1 from public.players where id::text=v_existing_partner) then
        raise exception 'Partner selezionato non valido.';
      end if;
    else
      if nullif(trim(p_partner#>>'{data,firstName}'),'') is null
         or nullif(trim(p_partner#>>'{data,lastName}'),'') is null
         or nullif(trim(p_partner#>>'{data,birth}'),'') is null
         or nullif(trim(p_partner#>>'{data,birthPlace}'),'') is null
         or nullif(trim(p_partner#>>'{data,postalCode}'),'') is null
         or nullif(trim(p_partner#>>'{data,residenceTown}'),'') is null
         or nullif(trim(p_partner#>>'{data,residenceProvince}'),'') is null
         or nullif(trim(p_partner#>>'{data,phone}'),'') is null
         or nullif(trim(p_partner#>>'{data,email}'),'') is null then
        raise exception 'Mancano dati obbligatori del partner.';
      end if;
    end if;
  end if;

  if v_existing_primary is not null and v_existing_partner=v_existing_primary then
    raise exception 'Giocatore e partner devono essere persone diverse.';
  end if;

  if exists(
    select 1 from public.public_registrations r
    where r.tournament_id=v_tournament
      and r.status not in ('rejected')
      and (
        (v_existing_primary is not null and (
          r.primary_payload->>'player_id'=v_existing_primary or
          r.partner_payload->>'player_id'=v_existing_primary
        ))
        or
        (v_existing_partner is not null and (
          r.primary_payload->>'player_id'=v_existing_partner or
          r.partner_payload->>'player_id'=v_existing_partner
        ))
      )
  ) then
    raise exception 'Uno dei giocatori risulta già presente tra le richieste.';
  end if;

  v_capacity := nullif(v_data->>'registrationCapacity','')::integer;
  select count(*) into v_accepted
  from public.public_registrations
  where tournament_id=v_tournament and status in ('accepted','imported');

  if v_capacity is not null and v_accepted >= v_capacity then
    v_status := 'waitlist';
  end if;

  insert into public.public_registrations(
    tournament_id,mode,primary_payload,partner_payload,status
  ) values(
    v_tournament,p_mode,p_primary,p_partner,v_status
  );

  return jsonb_build_object(
    'ok',true,
    'status',v_status,
    'message',case when v_status='waitlist'
      then 'Il torneo è al completo: la richiesta è stata inserita in lista d’attesa.'
      else 'La richiesta è stata inviata all’organizzatore.'
    end
  );
end;
$$;

create or replace function public.pam_admin_resolve_player(p_person jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  d jsonb;
  v_email text;
  v_phone text;
begin
  if p_person->>'kind'='existing' then
    v_id:=nullif(p_person->>'player_id','');
    if v_id is null or not exists(select 1 from public.players where id::text=v_id) then
      raise exception 'Giocatore selezionato non valido.';
    end if;
    return v_id;
  end if;

  d:=coalesce(p_person->'data','{}'::jsonb);
  v_email:=lower(trim(d->>'email'));
  v_phone:=regexp_replace(coalesce(d->>'phone',''),'[^0-9+]','','g');

  select id::text into v_id
  from public.players
  where lower(coalesce(data->>'email',''))=v_email
     or regexp_replace(coalesce(data->>'phone',''),'[^0-9+]','','g')=v_phone
  limit 1;

  if v_id is not null then return v_id; end if;

  v_id:=gen_random_uuid()::text;
  insert into public.players(id,data)
  values(
    v_id,
    jsonb_build_object(
      'id',v_id,
      'firstName',trim(d->>'firstName'),
      'lastName',trim(d->>'lastName'),
      'birth',trim(d->>'birth'),
      'birthPlace',trim(d->>'birthPlace'),
      'postalCode',trim(d->>'postalCode'),
      'residenceTown',trim(d->>'residenceTown'),
      'residenceProvince',upper(trim(d->>'residenceProvince')),
      'phone',trim(d->>'phone'),
      'email',v_email,
      'gender',coalesce(d->>'gender',''),
      'level',coalesce(d->>'level',''),
      'notes',coalesce(d->>'notes',''),
      'tokenBalance',0,
      'createdBy','public-registration'
    )
  );
  return v_id;
end;
$$;

create or replace function public.admin_process_public_registration(
  p_registration_id text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.public_registrations;
  v_primary text;
  v_partner text;
begin
  if auth.uid() is null then
    raise exception 'Accesso amministratore richiesto.';
  end if;

  if p_action not in ('accepted','rejected','waitlist') then
    raise exception 'Azione non valida.';
  end if;

  select * into r
  from public.public_registrations
  where id=p_registration_id
  for update;

  if r.id is null then raise exception 'Richiesta non trovata.'; end if;

  if p_action='accepted' then
    v_primary:=public.pam_admin_resolve_player(r.primary_payload);
    if r.mode='pair' then
      v_partner:=public.pam_admin_resolve_player(r.partner_payload);
      if v_partner=v_primary then raise exception 'Giocatore e partner coincidono.'; end if;
    end if;

    update public.public_registrations
    set status='accepted',
        primary_player_id=v_primary,
        partner_player_id=v_partner,
        updated_at=now()
    where id=r.id;

    return jsonb_build_object(
      'ok',true,
      'status','accepted',
      'primary_player_id',v_primary,
      'partner_player_id',v_partner
    );
  end if;

  update public.public_registrations
  set status=p_action,updated_at=now()
  where id=r.id;

  return jsonb_build_object('ok',true,'status',p_action);
end;
$$;

revoke all on function public.public_tournament_for_registration(text) from public;
revoke all on function public.public_search_players_for_registration(text,text) from public;
revoke all on function public.public_submit_tournament_registration_request(text,text,jsonb,jsonb) from public;
revoke all on function public.pam_admin_resolve_player(jsonb) from public;
revoke all on function public.admin_process_public_registration(text,text) from public;

grant execute on function public.public_tournament_for_registration(text) to anon, authenticated;
grant execute on function public.public_search_players_for_registration(text,text) to anon, authenticated;
grant execute on function public.public_submit_tournament_registration_request(text,text,jsonb,jsonb) to anon, authenticated;
grant execute on function public.admin_process_public_registration(text,text) to authenticated;

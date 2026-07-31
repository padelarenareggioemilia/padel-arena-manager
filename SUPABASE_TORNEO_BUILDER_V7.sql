-- PADEL ARENA MANAGER 7.0 - TORNEO BUILDER
-- Eseguire nel SQL Editor di Supabase. Non elimina dati esistenti.
create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table if not exists public.tournaments (
 id text primary key,
 name text not null,
 event_date date,
 club text,
 category text,
 competition_type text,
 logo_url text,
 share_token uuid not null default gen_random_uuid() unique,
 status text not null default 'published',
 data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);

create table if not exists public.players (
 id text primary key,
 data jsonb not null default '{}'::jsonb,
 photo_url text,
 updated_at timestamptz not null default now()
);

create table if not exists public.public_registrations (
 id uuid primary key default gen_random_uuid(),
 tournament_id text not null references public.tournaments(id) on delete cascade,
 mode text not null check (mode in ('single','pair')),
 status text not null default 'new' check (status in ('new','accepted','rejected','waitlist','imported')),
 primary_payload jsonb not null,
 partner_payload jsonb,
 created_at timestamptz not null default now(),
 processed_at timestamptz,
 processed_by uuid
);
create index if not exists public_registrations_tournament_idx on public.public_registrations(tournament_id,status,created_at);

alter table public.tournaments enable row level security;
alter table public.players enable row level security;
alter table public.public_registrations enable row level security;

-- Le letture pubbliche avvengono esclusivamente tramite funzioni security definer.
create or replace function public.public_tournament_for_registration(p_share_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t public.tournaments; d jsonb; accepted_count int; cap int; open_flag boolean; close_at timestamptz;
begin
 select * into t from public.tournaments where share_token=p_share_token;
 if not found then return null; end if;
 d:=coalesce(t.data,'{}'::jsonb);
 select count(*) into accepted_count from public.public_registrations where tournament_id=t.id and status='accepted';
 cap:=coalesce(nullif(d->>'maxParticipants','')::int,nullif(d->>'registrationCapacity','')::int,0);
 open_flag:=coalesce((d->>'registrationOpen')::boolean,true);
 if coalesce(d->>'registrationCloseDate','')<>'' then
  close_at:=((d->>'registrationCloseDate')||' '||coalesce(nullif(d->>'registrationCloseTime',''),'23:59'))::timestamptz;
  if now()>close_at then open_flag:=false; end if;
 end if;
 return jsonb_build_object(
  'id',t.id,'name',t.name,'event_date',t.event_date,'club',t.club,'category',t.category,
  'competition_type',t.competition_type,'logo_url',t.logo_url,'description',d->>'description',
  'address',coalesce(d->>'customAddress',''),'start_time',d->>'startTime','end_date',d->>'endDate','end_time',d->>'endTime',
  'entry_fee',coalesce(nullif(d->>'entryFee','')::numeric,0),'min_participants',coalesce(nullif(d->>'minParticipants','')::int,0),
  'max_participants',cap,'accepted_count',accepted_count,'available_places',case when cap>0 then greatest(cap-accepted_count,0) else null end,
  'registration_open',open_flag,'waitlist_enabled',coalesce((d->>'waitlistEnabled')::boolean,true),
  'registration_mode',coalesce(d->>'registrationMode','automatic'),'poster_theme',coalesce(d->>'posterTheme','eden_summer')
 );
end $$;

grant execute on function public.public_tournament_for_registration(uuid) to anon,authenticated;

create or replace function public.public_search_players_for_registration(p_share_token uuid,p_query text)
returns table(id text,full_name text) language sql security definer set search_path=public as $$
 select p.id,trim(coalesce(p.data->>'firstName','')||' '||coalesce(p.data->>'lastName',''))
 from public.players p
 where exists(select 1 from public.tournaments t where t.share_token=p_share_token)
 and lower(unaccent(coalesce(p.data->>'firstName','')||' '||coalesce(p.data->>'lastName',''))) like '%'||lower(unaccent(p_query))||'%'
 order by 2 limit 20;
$$;
grant execute on function public.public_search_players_for_registration(uuid,text) to anon,authenticated;

create or replace function public.public_submit_tournament_registration_request(p_share_token uuid,p_mode text,p_primary jsonb,p_partner jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t public.tournaments; d jsonb; cap int; accepted_count int; initial_status text; open_flag boolean; duplicate_count int;
begin
 select * into t from public.tournaments where share_token=p_share_token for update;
 if not found then raise exception 'Torneo non trovato'; end if;
 d:=coalesce(t.data,'{}'::jsonb); open_flag:=coalesce((d->>'registrationOpen')::boolean,true);
 if not open_flag then raise exception 'Le iscrizioni sono chiuse'; end if;
 if p_mode not in ('single','pair') then raise exception 'Modalità non valida'; end if;
 select count(*) into duplicate_count from public.public_registrations r where r.tournament_id=t.id and r.status in ('new','accepted','waitlist') and (
  (p_primary->>'kind'='existing' and (r.primary_payload->>'player_id'=p_primary->>'player_id' or r.partner_payload->>'player_id'=p_primary->>'player_id')) or
  (p_primary->>'kind'='new' and lower(r.primary_payload#>>'{data,email}')=lower(p_primary#>>'{data,email}'))
 );
 if duplicate_count>0 then raise exception 'Risulta già una richiesta attiva con questi dati'; end if;
 select count(*) into accepted_count from public.public_registrations where tournament_id=t.id and status='accepted';
 cap:=coalesce(nullif(d->>'maxParticipants','')::int,nullif(d->>'registrationCapacity','')::int,0);
 if cap>0 and accepted_count>=cap then
  if coalesce((d->>'waitlistEnabled')::boolean,true) then initial_status:='waitlist'; else raise exception 'Posti esauriti e lista d’attesa non disponibile'; end if;
 elsif coalesce(d->>'registrationMode','automatic')='automatic' then initial_status:='accepted';
 else initial_status:='new'; end if;
 insert into public.public_registrations(tournament_id,mode,status,primary_payload,partner_payload) values(t.id,p_mode,initial_status,p_primary,p_partner);
 return jsonb_build_object('status',initial_status,'message',case initial_status when 'accepted' then 'Iscrizione confermata.' when 'waitlist' then 'Posti esauriti: sei stato inserito in lista d’attesa.' else 'Richiesta inviata all’organizzatore per approvazione.' end);
end $$;
grant execute on function public.public_submit_tournament_registration_request(uuid,text,jsonb,jsonb) to anon,authenticated;

create or replace function public.admin_process_public_registration(p_registration_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.public_registrations; primary_id text; partner_id text;
begin
 if auth.uid() is null then raise exception 'Accesso richiesto'; end if;
 if p_action not in ('accepted','rejected','waitlist') then raise exception 'Azione non valida'; end if;
 select * into r from public.public_registrations where id=p_registration_id for update;
 if not found then raise exception 'Richiesta non trovata'; end if;
 update public.public_registrations set status=p_action,processed_at=now(),processed_by=auth.uid() where id=p_registration_id;
 if p_action='accepted' then
  if r.primary_payload->>'kind'='existing' then primary_id:=r.primary_payload->>'player_id'; else primary_id:='p_'||replace(gen_random_uuid()::text,'-',''); insert into public.players(id,data) values(primary_id,r.primary_payload->'data') on conflict do nothing; end if;
  if r.mode='pair' and r.partner_payload is not null then if r.partner_payload->>'kind'='existing' then partner_id:=r.partner_payload->>'player_id'; else partner_id:='p_'||replace(gen_random_uuid()::text,'-',''); insert into public.players(id,data) values(partner_id,r.partner_payload->'data') on conflict do nothing; end if; end if;
 end if;
 return jsonb_build_object('primary_player_id',primary_id,'partner_player_id',partner_id,'status',p_action);
end $$;
grant execute on function public.admin_process_public_registration(uuid,text) to authenticated;

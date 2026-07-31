-- PADEL ARENA MANAGER 7.1 - SINCRONIZZAZIONE COMPLETA
-- Copiare tutto nel SQL Editor di Supabase e premere Run.

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
 mode text not null default 'single',
 status text not null default 'new',
 primary_payload jsonb not null default '{}'::jsonb,
 partner_payload jsonb,
 created_at timestamptz not null default now(),
 processed_at timestamptz,
 processed_by uuid
);

alter table public.tournaments enable row level security;
alter table public.players enable row level security;
alter table public.public_registrations enable row level security;

drop policy if exists pam_tournaments_authenticated on public.tournaments;
drop policy if exists pam_players_authenticated on public.players;
drop policy if exists pam_registrations_authenticated on public.public_registrations;

create policy pam_tournaments_authenticated on public.tournaments
 for all to authenticated using (true) with check (true);
create policy pam_players_authenticated on public.players
 for all to authenticated using (true) with check (true);
create policy pam_registrations_authenticated on public.public_registrations
 for all to authenticated using (true) with check (true);

grant select,insert,update,delete on public.tournaments to authenticated;
grant select,insert,update,delete on public.players to authenticated;
grant select,insert,update,delete on public.public_registrations to authenticated;

-- Evita il conflitto tra token UUID e testo.
drop function if exists public.public_tournament_for_registration(uuid);
drop function if exists public.public_tournament_for_registration(text);

create function public.public_tournament_for_registration(p_share_token text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare t public.tournaments; d jsonb; accepted_count int; cap int; open_flag boolean; close_at timestamptz;
begin
 select * into t from public.tournaments where share_token::text=p_share_token;
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
  'max_participants',cap,'accepted_count',accepted_count,
  'available_places',case when cap>0 then greatest(cap-accepted_count,0) else null end,
  'registration_open',open_flag,'waitlist_enabled',coalesce((d->>'waitlistEnabled')::boolean,true),
  'registration_mode',coalesce(d->>'registrationMode','automatic'),'poster_theme',coalesce(d->>'posterTheme','eden_summer')
 );
end $$;

grant execute on function public.public_tournament_for_registration(text) to anon,authenticated;

-- Aggiorna automaticamente l'orario di modifica.
create or replace function public.pam_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

drop trigger if exists pam_touch_tournaments on public.tournaments;
create trigger pam_touch_tournaments before update on public.tournaments
for each row execute function public.pam_touch_updated_at();

drop trigger if exists pam_touch_players on public.players;
create trigger pam_touch_players before update on public.players
for each row execute function public.pam_touch_updated_at();

-- Aggiunge le tabelle alla pubblicazione realtime, se non sono già presenti.
do $$
begin
 begin alter publication supabase_realtime add table public.tournaments; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.players; exception when duplicate_object then null; end;
 begin alter publication supabase_realtime add table public.public_registrations; exception when duplicate_object then null; end;
end $$;

notify pgrst, 'reload schema';
-- PADEL ARENA MANAGER 7.1.1
-- Correzione salvataggio tornei: stato non ammesso dal vincolo tournaments_status_check.

ALTER TABLE public.tournaments
DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_status_check
CHECK (status IN ('draft','published','active','closed','archived'));

UPDATE public.tournaments
SET status = 'published'
WHERE status IS NULL OR status = '';

NOTIFY pgrst, 'reload schema';

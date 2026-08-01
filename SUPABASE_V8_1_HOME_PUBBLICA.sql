-- PADEL ARENA MANAGER V8.1 · HOME PUBBLICA
-- Eseguire una sola volta in Supabase > SQL Editor.
-- Non elimina dati esistenti e non espone dati personali riservati.

create extension if not exists pgcrypto;

create table if not exists public.championship_public_matches(
 id uuid primary key default gen_random_uuid(),
 competition text not null default 'Campionato AICS 2027',
 series text not null,
 round_label text,
 event_date date,
 start_time text,
 venue text,
 home_team_id text references public.championship_teams(id) on delete set null,
 away_team_id text references public.championship_teams(id) on delete set null,
 home_score integer,
 away_score integer,
 status text not null default 'scheduled' check(status in('scheduled','played','postponed','cancelled')),
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create table if not exists public.championship_public_standings(
 id uuid primary key default gen_random_uuid(),
 competition text not null default 'Campionato AICS 2027',
 series text not null,
 team_id text not null references public.championship_teams(id) on delete cascade,
 played integer not null default 0,
 won integer not null default 0,
 drawn integer not null default 0,
 lost integer not null default 0,
 points integer not null default 0,
 position_override integer,
 updated_at timestamptz default now(),
 unique(competition,series,team_id)
);

create table if not exists public.championship_public_lineups(
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.championship_public_matches(id) on delete cascade,
 team_id text not null references public.championship_teams(id) on delete cascade,
 first_name text not null,
 last_name text not null,
 photo_url text,
 lineup_order integer not null default 1,
 created_at timestamptz default now()
);

create or replace function public.public_upcoming_tournaments()
returns table(
 id text,name text,event_date date,start_time text,end_time text,club text,address text,
 category text,competition_type text,logo_url text,description text,entry_fee numeric,
 max_participants integer,registered_count integer,available_places integer,
 registration_open boolean,waitlist_enabled boolean,share_token text,poster_theme text
)
language sql security definer set search_path=public as $$
 select t.id,
  coalesce(t.name,t.data->>'name'),t.event_date,
  t.data->>'startTime',t.data->>'endTime',coalesce(t.club,t.data->>'club'),
  coalesce(t.data->>'customAddress',t.data->>'address'),coalesce(t.category,t.data->>'category'),
  coalesce(t.competition_type,t.data->>'competitionType'),coalesce(t.logo_url,t.data->>'logoUrl'),
  t.data->>'description',coalesce(nullif(t.data->>'entryFee','')::numeric,0),
  coalesce(nullif(t.data->>'registrationCapacity','')::integer,nullif(t.data->>'maxParticipants','')::integer),
  (select count(*)::integer from public.public_registrations r where r.tournament_id=t.id and r.status in('accepted','imported')),
  greatest(0,coalesce(nullif(t.data->>'registrationCapacity','')::integer,nullif(t.data->>'maxParticipants','')::integer,999)-
   (select count(*)::integer from public.public_registrations r where r.tournament_id=t.id and r.status in('accepted','imported'))),
  coalesce(nullif(t.data->>'registrationOpen','')::boolean,t.status in('published','active','registration_open')),
  coalesce(nullif(t.data->>'waitlistEnabled','')::boolean,true),t.share_token,coalesce(t.data->>'posterTheme','eden_summer')
 from public.tournaments t
 where t.status in('published','active','registration_open','registration_closed')
   and (t.event_date is null or t.event_date>=current_date-1)
 order by t.event_date nulls last,coalesce(t.data->>'startTime','23:59');
$$;

create or replace function public.public_championship_matches()
returns table(id uuid,competition text,series text,round_label text,event_date date,start_time text,venue text,
 home_team_name text,away_team_name text,home_team_logo text,away_team_logo text,home_score integer,away_score integer,status text)
language sql security definer set search_path=public as $$
 select m.id,m.competition,m.series,m.round_label,m.event_date,m.start_time,m.venue,
  h.team_name,a.team_name,h.team_logo_url,a.team_logo_url,m.home_score,m.away_score,m.status
 from public.championship_public_matches m
 left join public.championship_teams h on h.id=m.home_team_id
 left join public.championship_teams a on a.id=m.away_team_id
 where m.status<>'cancelled'
 order by m.event_date nulls last,m.start_time nulls last;
$$;

create or replace function public.public_championship_standings()
returns table(competition text,series text,team_name text,team_logo_url text,played integer,won integer,drawn integer,lost integer,points integer)
language sql security definer set search_path=public as $$
 select s.competition,s.series,t.team_name,t.team_logo_url,s.played,s.won,s.drawn,s.lost,s.points
 from public.championship_public_standings s join public.championship_teams t on t.id=s.team_id
 order by s.series,coalesce(s.position_override,999),s.points desc,s.won desc,t.team_name;
$$;

create or replace function public.public_championship_lineups()
returns table(match_id uuid,series text,match_label text,team_name text,first_name text,last_name text,photo_url text,lineup_order integer)
language sql security definer set search_path=public as $$
 select l.match_id,m.series,coalesce(m.round_label,'Formazione'),t.team_name,l.first_name,l.last_name,l.photo_url,l.lineup_order
 from public.championship_public_lineups l
 join public.championship_public_matches m on m.id=l.match_id
 join public.championship_teams t on t.id=l.team_id
 order by m.event_date nulls last,m.start_time nulls last,l.team_id,l.lineup_order;
$$;

revoke all on function public.public_upcoming_tournaments() from public;
revoke all on function public.public_championship_matches() from public;
revoke all on function public.public_championship_standings() from public;
revoke all on function public.public_championship_lineups() from public;
grant execute on function public.public_upcoming_tournaments(),public.public_championship_matches(),public.public_championship_standings(),public.public_championship_lineups() to anon,authenticated;

alter table public.championship_public_matches enable row level security;
alter table public.championship_public_standings enable row level security;
alter table public.championship_public_lineups enable row level security;

drop policy if exists championship_public_matches_admin on public.championship_public_matches;
drop policy if exists championship_public_standings_admin on public.championship_public_standings;
drop policy if exists championship_public_lineups_admin on public.championship_public_lineups;
create policy championship_public_matches_admin on public.championship_public_matches for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy championship_public_standings_admin on public.championship_public_standings for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy championship_public_lineups_admin on public.championship_public_lineups for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

grant select,insert,update,delete on public.championship_public_matches,public.championship_public_standings,public.championship_public_lineups to authenticated;
notify pgrst,'reload schema';

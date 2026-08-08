-- PADEL ARENA MANAGER V8.1.26 LAB
-- ESPONE WHATSAPP + EMAIL ORGANIZZATORE ALLE PAGINE PUBBLICHE
begin;

create or replace function public.public_tournament_for_registration(p_share_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t public.tournaments; d jsonb; count_ok int;
begin
 select * into t from public.tournaments where share_token=p_share_token limit 1;
 if not found then return null; end if;
 d=coalesce(t.data,'{}'::jsonb);
 select count(*) into count_ok from public.public_registrations where tournament_id=t.id and status in('accepted','imported');
 return jsonb_build_object(
  'id',t.id,'name',coalesce(t.name,d->>'name'),'date',coalesce(t.event_date::text,d->>'date'),
  'start_time',d->>'startTime','end_date',d->>'endDate','end_time',d->>'endTime',
  'club',coalesce(t.club,d->>'club'),'address',d->>'customAddress',
  'category',coalesce(t.category,d->>'category'),'competition_type',coalesce(t.competition_type,d->>'competitionType'),
  'logo_url',coalesce(t.logo_url,d->>'logoUrl'),'description',d->>'description',
  'entry_fee',coalesce(nullif(d->>'entryFee','')::numeric,0),
  'max_participants',coalesce(nullif(d->>'registrationCapacity','')::int,nullif(d->>'maxParticipants','')::int),
  'available_places',greatest(0,coalesce(nullif(d->>'registrationCapacity','')::int,nullif(d->>'maxParticipants','')::int,999)-count_ok),
  'registration_open',coalesce(nullif(d->>'registrationOpen','')::boolean,true),
  'poster_theme',coalesce(d->>'posterTheme','eden_summer'),
  'organizer_phone',nullif(trim(d->>'organizerPhone'),''),
  'organizer_email',nullif(trim(d->>'organizerEmail'),''),
  'accent','#9dff25'
 );
end$$;

drop function if exists public.public_upcoming_tournaments();

create function public.public_upcoming_tournaments()
returns table(
 id text,name text,event_date date,start_time text,end_time text,club text,address text,
 category text,competition_type text,logo_url text,description text,entry_fee numeric,
 max_participants integer,registered_count integer,available_places integer,
 registration_open boolean,waitlist_enabled boolean,share_token text,poster_theme text,
 organizer_phone text,organizer_email text
)
language sql security definer set search_path=public as $$
 select t.id,coalesce(t.name,t.data->>'name'),t.event_date,t.data->>'startTime',t.data->>'endTime',
 coalesce(t.club,t.data->>'club'),coalesce(t.data->>'customAddress',t.data->>'address'),
 coalesce(t.category,t.data->>'category'),coalesce(t.competition_type,t.data->>'competitionType'),
 coalesce(t.logo_url,t.data->>'logoUrl'),t.data->>'description',
 coalesce(nullif(t.data->>'entryFee','')::numeric,0),
 coalesce(nullif(t.data->>'registrationCapacity','')::integer,nullif(t.data->>'maxParticipants','')::integer),
 (select count(*)::integer from public.public_registrations r where r.tournament_id=t.id and r.status in('accepted','imported')),
 greatest(0,coalesce(nullif(t.data->>'registrationCapacity','')::integer,nullif(t.data->>'maxParticipants','')::integer,999)
 -(select count(*)::integer from public.public_registrations r where r.tournament_id=t.id and r.status in('accepted','imported'))),
 coalesce(nullif(t.data->>'registrationOpen','')::boolean,t.status in('published','active','registration_open')),
 coalesce(nullif(t.data->>'waitlistEnabled','')::boolean,true),t.share_token,
 coalesce(t.data->>'posterTheme','eden_summer'),
 nullif(trim(t.data->>'organizerPhone'),''),
 nullif(trim(t.data->>'organizerEmail'),'')
 from public.tournaments t
 where t.status in('published','active','registration_open','registration_closed')
 and (t.event_date is null or t.event_date>=current_date-1)
 order by t.event_date nulls last,coalesce(t.data->>'startTime','23:59');
$$;

grant execute on function public.public_tournament_for_registration(text) to anon,authenticated;
grant execute on function public.public_upcoming_tournaments() to anon,authenticated;
commit;
notify pgrst,'reload schema';

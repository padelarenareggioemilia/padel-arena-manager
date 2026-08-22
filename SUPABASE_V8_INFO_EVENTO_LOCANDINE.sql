-- PADEL ARENA MANAGER V8
-- INFO EVENTO + DATI COMPLETI PER LOCANDINA AUTOMATICA
begin;

create or replace function public.public_tournament_for_registration(p_share_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t public.tournaments; d jsonb; count_ok int;
begin
 select * into t from public.tournaments where share_token=p_share_token limit 1;
 if not found then return null; end if;
 d=coalesce(t.data,'{}'::jsonb);
 select count(*) into count_ok from public.public_registrations
 where tournament_id=t.id and status in('accepted','imported');
 return jsonb_build_object(
  'id',t.id,'name',coalesce(t.name,d->>'name'),'date',coalesce(t.event_date::text,d->>'date'),
  'start_time',d->>'startTime','end_date',d->>'endDate','end_time',d->>'endTime',
  'club',coalesce(t.club,d->>'club'),'address',d->>'customAddress',
  'category',coalesce(t.category,d->>'category'),
  'competition_type',coalesce(t.competition_type,d->>'competitionType'),
  'logo_url',coalesce(t.logo_url,d->>'logoUrl'),'description',d->>'description',
  'entry_fee',coalesce(nullif(d->>'entryFee','')::numeric,0),
  'max_participants',coalesce(nullif(d->>'registrationCapacity','')::int,nullif(d->>'maxParticipants','')::int),
  'available_places',greatest(0,coalesce(nullif(d->>'registrationCapacity','')::int,nullif(d->>'maxParticipants','')::int,999)-count_ok),
  'registration_open',coalesce(nullif(d->>'registrationOpen','')::boolean,true),
  'poster_theme',coalesce(d->>'posterTheme','eden_summer'),
  'organizer_name',nullif(trim(d->>'organizerName'),''),
  'organizer_phone',nullif(trim(d->>'organizerPhone'),''),
  'organizer_email',nullif(trim(d->>'organizerEmail'),''),
  'host_club_logo',nullif(d->>'hostClubLogo',''),
  'organizer_logo',nullif(d->>'organizerLogo',''),
  'main_sponsor_logo',nullif(d->>'mainSponsorLogo',''),
  'extra_sponsor_logo_1',nullif(d->>'extraSponsorLogo1',''),
  'extra_sponsor_logo_2',nullif(d->>'extraSponsorLogo2',''),
  'accent','#9dff25'
 );
end$$;

revoke all on function public.public_tournament_for_registration(text) from public;
grant execute on function public.public_tournament_for_registration(text) to anon,authenticated;
commit;
notify pgrst,'reload schema';

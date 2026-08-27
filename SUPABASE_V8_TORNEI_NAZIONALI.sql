-- PADEL ARENA MANAGER V8.2.38.13 - TORNEI NAZIONALI, REGOLAMENTO E ALLEGATI
-- Eseguire una sola volta nel SQL Editor di Supabase.
-- Non modifica né cancella giocatori, tornei, risultati o iscrizioni esistenti.

create or replace function public.public_submit_tournament_registration_request(
  p_share_token text,
  p_mode text,
  p_primary jsonb,
  p_partner jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  tid text;
  rid text;
  cap int;
  accepted_count int;
  competition text;
  st text := 'new';
begin
  select id,
         competition_type,
         case
           when competition_type='national_event' then null
           else coalesce((data->>'registrationCapacity')::int,(data->>'maxParticipants')::int)
         end
    into tid,competition,cap
  from public.tournaments
  where share_token=p_share_token
    and coalesce((data->>'registrationOpen')::boolean,true)=true
  limit 1;

  if tid is null then raise exception 'Iscrizioni chiuse o torneo non trovato'; end if;
  if p_mode not in ('single','pair') then raise exception 'Modalità non valida'; end if;
  if competition='national_event' then
    if p_mode<>'pair' or p_partner is null then raise exception 'Per il torneo nazionale è richiesta una coppia completa'; end if;
    if coalesce(p_primary->'data'->>'nationalCategory','') not in ('Maschile','Femminile','Misto') then
      raise exception 'Categoria nazionale non valida';
    end if;
  end if;

  select count(*) into accepted_count
  from public.public_registrations
  where tournament_id=tid and status in ('accepted','imported');

  if cap is not null and accepted_count>=cap then st:='waitlist'; end if;

  insert into public.public_registrations(tournament_id,mode,primary_payload,partner_payload,status)
  values(tid,p_mode,p_primary,p_partner,st)
  returning id into rid;

  return jsonb_build_object(
    'id',rid,
    'status',st,
    'message',case when st='waitlist'
      then 'Posti esauriti: richiesta inserita in lista d’attesa.'
      else 'Richiesta inviata all’organizzatore.'
    end
  );
end
$$;

grant execute on function public.public_submit_tournament_registration_request(text,text,jsonb,jsonb) to anon,authenticated;

create or replace function public.pam_resolve_registration_player_v823811(p_person jsonb)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  payload jsonb := coalesce(p_person->'data','{}'::jsonb);
  player_id text;
  player_email text := lower(trim(coalesce(p_person->'data'->>'email','')));
  player_phone text := regexp_replace(coalesce(p_person->'data'->>'phone',''),'[^0-9]','','g');
begin
  if p_person->>'kind'='existing' then
    player_id:=nullif(p_person->>'player_id','');
    if player_id is null then raise exception 'Giocatore selezionato non valido'; end if;
    update public.players
      set data=coalesce(data,'{}'::jsonb)||payload,updated_at=now()
      where id=player_id;
    return player_id;
  end if;

  if coalesce(payload->>'nationalCategory','')<>'' then
    select id into player_id
    from public.players
    where (player_email<>'' and lower(trim(coalesce(data->>'email','')))=player_email)
       or (
         player_phone<>''
         and regexp_replace(coalesce(data->>'phone',''),'[^0-9]','','g')=player_phone
         and lower(trim(coalesce(data->>'firstName','')))=lower(trim(coalesce(payload->>'firstName','')))
         and lower(trim(coalesce(data->>'lastName','')))=lower(trim(coalesce(payload->>'lastName','')))
       )
    order by updated_at desc nulls last
    limit 1;
  end if;

  if player_id is null then
    player_id:='p_'||gen_random_uuid()::text;
    insert into public.players(id,data)
    values(player_id,jsonb_build_object('id',player_id,'tokenBalance',0,'createdBy','public-registration')||payload);
  else
    update public.players
      set data=coalesce(data,'{}'::jsonb)||payload,updated_at=now()
      where id=player_id;
  end if;
  return player_id;
end
$$;

create or replace function public.admin_process_public_registration(
  p_registration_id text,
  p_action text,
  p_capacity integer default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  r public.public_registrations;
  pid1 text;
  pid2 text;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then
    raise exception 'Operazione riservata all’amministratore';
  end if;
  select * into r from public.public_registrations where id=p_registration_id for update;
  if not found then raise exception 'Richiesta non trovata'; end if;

  if p_action='accepted' then
    pid1:=public.pam_resolve_registration_player_v823811(r.primary_payload);
    if r.partner_payload is not null then
      pid2:=public.pam_resolve_registration_player_v823811(r.partner_payload);
      if pid1=pid2 then raise exception 'I due componenti della coppia coincidono'; end if;
    end if;
    update public.public_registrations
      set status='accepted',primary_player_id=pid1,partner_player_id=pid2,updated_at=now()
      where id=r.id;
  elsif p_action='waitlist' then
    update public.public_registrations set status='waitlist',updated_at=now() where id=r.id;
  elsif p_action='rejected' then
    update public.public_registrations set status='rejected',updated_at=now() where id=r.id;
  else
    raise exception 'Azione non valida';
  end if;

  return jsonb_build_object('status',p_action,'player_ids',jsonb_build_array(pid1,pid2));
end
$$;

revoke all on function public.pam_resolve_registration_player_v823811(jsonb) from public;
grant execute on function public.admin_process_public_registration(text,text,integer) to authenticated;

-- Espone nella pagina pubblica anche regolamento testuale ed eventuale allegato.
-- I dati restano nel JSON del torneo: non vengono aggiunte colonne e non vengono modificati eventi esistenti.
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
  'regulation_text',d->>'regulationText',
  'regulation_file_url',d->>'regulationFileUrl',
  'regulation_file_name',d->>'regulationFileName',
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
notify pgrst,'reload schema';

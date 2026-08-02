-- PADEL ARENA MANAGER V8.1.16
-- ISCRIZIONI INTELLIGENTI, CONTROLLO DOPPIONI E LISTA PUBBLICA
-- Eseguire una sola volta in Supabase > SQL Editor > New query.
-- Migrazione non distruttiva: non elimina tornei, giocatori, richieste, risultati o gettoni.

create or replace function public.pam_norm_text(v text)
returns text
language sql
immutable
as $$
 select lower(regexp_replace(trim(coalesce(v,'')),'[^a-zA-ZÀ-ÿ0-9]+','','g'))
$$;

create or replace function public.pam_norm_phone(v text)
returns text
language sql
immutable
as $$
 select regexp_replace(coalesce(v,''),'[^0-9]','','g')
$$;

create or replace function public.pam_player_missing_fields(d jsonb)
returns jsonb
language sql
immutable
as $$
 select coalesce(jsonb_agg(k order by ord),'[]'::jsonb)
 from (
  values
   ('firstName',1),('lastName',2),('birth',3),('birthPlace',4),('postalCode',5),
   ('residenceTown',6),('residenceProvince',7),('phone',8),('email',9),('gender',10)
 ) x(k,ord)
 where nullif(trim(coalesce(d->>k,'')),'') is null
$$;

create or replace function public.pam_fill_player_missing(p_player_id text,p_patch jsonb)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
 d jsonb;
 k text;
begin
 select coalesce(data,'{}'::jsonb) into d from public.players where id=p_player_id for update;
 if d is null then raise exception 'Giocatore non trovato.'; end if;
 foreach k in array array['firstName','lastName','birth','birthPlace','postalCode','residenceTown','residenceProvince','phone','email','gender','level','notes'] loop
  if nullif(trim(coalesce(d->>k,'')),'') is null and nullif(trim(coalesce(p_patch->>k,'')),'') is not null then
   d:=jsonb_set(d,array[k],to_jsonb(trim(p_patch->>k)),true);
  end if;
 end loop;
 update public.players set data=d,updated_at=now() where id=p_player_id;
 return p_player_id;
end$$;

create or replace function public.pam_find_existing_player(p_data jsonb)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
 v_id text;
 v_email text:=public.pam_norm_text(p_data->>'email');
 v_phone text:=public.pam_norm_phone(p_data->>'phone');
 v_name text:=public.pam_norm_text(coalesce(p_data->>'firstName','')||coalesce(p_data->>'lastName',''));
 v_birth text:=trim(coalesce(p_data->>'birth',''));
begin
 if v_email<>'' then
  select id into v_id from public.players where public.pam_norm_text(data->>'email')=v_email order by updated_at desc nulls last limit 1;
 end if;
 if v_id is null and length(v_phone)>=7 then
  select id into v_id from public.players where public.pam_norm_phone(data->>'phone')=v_phone order by updated_at desc nulls last limit 1;
 end if;
 if v_id is null and v_name<>'' and v_birth<>'' then
  select id into v_id from public.players
  where public.pam_norm_text(coalesce(data->>'firstName','')||coalesce(data->>'lastName',''))=v_name
    and trim(coalesce(data->>'birth',''))=v_birth
  order by updated_at desc nulls last limit 1;
 end if;
 return v_id;
end$$;

create or replace function public.public_search_players_for_registration(
 p_share_token text,
 p_query text
)
returns table(id text,full_name text,missing_fields jsonb,registration_status text)
language plpgsql
security definer
set search_path=public
as $$
begin
 if length(trim(coalesce(p_query,'')))<2 then return; end if;
 if not exists(select 1 from public.tournaments where share_token=p_share_token and coalesce(status,'published')<>'cancelled') then
  raise exception 'Link torneo non valido.';
 end if;

 return query
 with tournament_row as (
  select t.id from public.tournaments t where t.share_token=p_share_token limit 1
 ), ranked as (
  select
   p.id,
   trim(coalesce(p.data->>'firstName','')||' '||coalesce(p.data->>'lastName','')) as full_name,
   p.data,
   public.pam_norm_text(coalesce(p.data->>'firstName','')||coalesce(p.data->>'lastName','')) as name_key,
   jsonb_array_length(public.pam_player_missing_fields(p.data)) as missing_count,
   row_number() over(
    partition by public.pam_norm_text(coalesce(p.data->>'firstName','')||coalesce(p.data->>'lastName',''))
    order by jsonb_array_length(public.pam_player_missing_fields(p.data)),p.updated_at desc nulls last,p.created_at desc nulls last
   ) as rn
  from public.players p
  where lower(coalesce(p.data->>'firstName','')||' '||coalesce(p.data->>'lastName','')||' '||coalesce(p.data->>'lastName','')||' '||coalesce(p.data->>'firstName',''))
        like '%'||lower(trim(p_query))||'%'
 ), selected as (
  select * from ranked where rn=1 and name_key<>''
 )
 select
  s.id,
  s.full_name,
  public.pam_player_missing_fields(s.data),
  (
   select r.status
   from public.public_registrations r,tournament_row tr
   where r.tournament_id=tr.id
    and r.status<>'rejected'
    and (
      r.primary_player_id=s.id or r.partner_player_id=s.id or
      r.primary_payload->>'player_id'=s.id or r.partner_payload->>'player_id'=s.id or
      public.pam_norm_text(coalesce(r.primary_payload#>>'{data,firstName}','')||coalesce(r.primary_payload#>>'{data,lastName}',''))=s.name_key or
      public.pam_norm_text(coalesce(r.partner_payload#>>'{data,firstName}','')||coalesce(r.partner_payload#>>'{data,lastName}',''))=s.name_key
    )
   order by r.created_at desc limit 1
  )
 from selected s
 order by s.full_name
 limit 20;
end$$;

create or replace function public.public_tournament_registration_list(p_share_token text)
returns table(full_name text,status text,mode text,created_at timestamptz)
language sql
security definer
set search_path=public
as $$
 with tr as (
  select id from public.tournaments where share_token=p_share_token and coalesce(status,'published')<>'cancelled' limit 1
 ), rows as (
  select r.*,
   trim(coalesce(p1.data->>'firstName',r.primary_payload#>>'{data,firstName}','')||' '||coalesce(p1.data->>'lastName',r.primary_payload#>>'{data,lastName}','')) as n1,
   trim(coalesce(p2.data->>'firstName',r.partner_payload#>>'{data,firstName}','')||' '||coalesce(p2.data->>'lastName',r.partner_payload#>>'{data,lastName}','')) as n2
  from public.public_registrations r
  join tr on tr.id=r.tournament_id
  left join public.players p1 on p1.id=coalesce(r.primary_player_id,r.primary_payload->>'player_id')
  left join public.players p2 on p2.id=coalesce(r.partner_player_id,r.partner_payload->>'player_id')
  where r.status in('new','accepted','waitlist','imported')
 )
 select
  case when mode='pair' and nullif(n2,'') is not null then n1||' / '||n2 else n1 end,
  status,mode,created_at
 from rows
 where nullif(n1,'') is not null
 order by case status when 'accepted' then 1 when 'imported' then 1 when 'new' then 2 when 'waitlist' then 3 else 4 end,created_at;
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
set search_path=public
as $$
declare
 tid text;
 td jsonb;
 cap integer;
 accepted_count integer;
 st text:='new';
 pid1 text;
 pid2 text;
 d1 jsonb:=coalesce(p_primary->'data','{}'::jsonb);
 d2 jsonb:=coalesce(p_partner->'data','{}'::jsonb);
 existing public.public_registrations;
 primary_payload jsonb:=p_primary;
 partner_payload jsonb:=p_partner;
 required_missing jsonb;
begin
 if p_mode not in('single','pair') then raise exception 'Modalità non valida.'; end if;
 select id,coalesce(data,'{}'::jsonb) into tid,td
 from public.tournaments
 where share_token=p_share_token and coalesce(status,'published')<>'cancelled'
   and coalesce((data->>'registrationOpen')::boolean,true)=true
 limit 1;
 if tid is null then raise exception 'Iscrizioni chiuse o torneo non trovato.'; end if;
 if p_mode='pair' and p_partner is null then raise exception 'Indica il partner.'; end if;

 if p_primary->>'kind'='existing' then
  pid1:=nullif(p_primary->>'player_id','');
  if pid1 is null or not exists(select 1 from public.players where id=pid1) then raise exception 'Giocatore selezionato non valido.'; end if;
  perform public.pam_fill_player_missing(pid1,d1);
 else
  required_missing:=public.pam_player_missing_fields(d1);
  if jsonb_array_length(required_missing)>0 then raise exception 'Completa tutti i dati obbligatori.'; end if;
  pid1:=public.pam_find_existing_player(d1);
  if pid1 is not null then perform public.pam_fill_player_missing(pid1,d1); end if;
 end if;
 if pid1 is not null then primary_payload:=jsonb_build_object('kind','existing','player_id',pid1,'data',d1); end if;

 if p_mode='pair' then
  if p_partner->>'kind'='existing' then
   pid2:=nullif(p_partner->>'player_id','');
   if pid2 is null or not exists(select 1 from public.players where id=pid2) then raise exception 'Partner selezionato non valido.'; end if;
   perform public.pam_fill_player_missing(pid2,d2);
  else
   required_missing:=public.pam_player_missing_fields(d2);
   if jsonb_array_length(required_missing)>0 then raise exception 'Completa tutti i dati obbligatori del partner.'; end if;
   pid2:=public.pam_find_existing_player(d2);
   if pid2 is not null then perform public.pam_fill_player_missing(pid2,d2); end if;
  end if;
  if pid2 is not null then partner_payload:=jsonb_build_object('kind','existing','player_id',pid2,'data',d2); end if;
 end if;
 if pid1 is not null and pid1=pid2 then raise exception 'Giocatore e partner devono essere persone diverse.'; end if;

 select r.* into existing
 from public.public_registrations r
 where r.tournament_id=tid and r.status<>'rejected' and (
  (pid1 is not null and (r.primary_player_id=pid1 or r.partner_player_id=pid1 or r.primary_payload->>'player_id'=pid1 or r.partner_payload->>'player_id'=pid1)) or
  (pid2 is not null and (r.primary_player_id=pid2 or r.partner_player_id=pid2 or r.primary_payload->>'player_id'=pid2 or r.partner_payload->>'player_id'=pid2)) or
  (public.pam_norm_text(d1->>'email')<>'' and (
    public.pam_norm_text(r.primary_payload#>>'{data,email}')=public.pam_norm_text(d1->>'email') or public.pam_norm_text(r.partner_payload#>>'{data,email}')=public.pam_norm_text(d1->>'email')
  )) or
  (length(public.pam_norm_phone(d1->>'phone'))>=7 and (
    public.pam_norm_phone(r.primary_payload#>>'{data,phone}')=public.pam_norm_phone(d1->>'phone') or public.pam_norm_phone(r.partner_payload#>>'{data,phone}')=public.pam_norm_phone(d1->>'phone')
  )) or
  (public.pam_norm_text(coalesce(d1->>'firstName','')||coalesce(d1->>'lastName',''))<>'' and trim(coalesce(d1->>'birth',''))<>'' and (
    (public.pam_norm_text(coalesce(r.primary_payload#>>'{data,firstName}','')||coalesce(r.primary_payload#>>'{data,lastName}',''))=public.pam_norm_text(coalesce(d1->>'firstName','')||coalesce(d1->>'lastName','')) and r.primary_payload#>>'{data,birth}'=d1->>'birth') or
    (public.pam_norm_text(coalesce(r.partner_payload#>>'{data,firstName}','')||coalesce(r.partner_payload#>>'{data,lastName}',''))=public.pam_norm_text(coalesce(d1->>'firstName','')||coalesce(d1->>'lastName','')) and r.partner_payload#>>'{data,birth}'=d1->>'birth')
  ))
 )
 order by r.created_at desc limit 1;

 if found then
  return jsonb_build_object('ok',true,'already_registered',true,'status',existing.status,
   'message',case existing.status when 'accepted' then 'La tua iscrizione risulta già confermata.' when 'imported' then 'Sei già presente tra gli iscritti.' when 'waitlist' then 'La tua richiesta è già in lista d’attesa.' else 'La tua richiesta è già stata inviata ed è in valutazione.' end);
 end if;

 cap:=coalesce(nullif(td->>'registrationCapacity','')::integer,nullif(td->>'maxParticipants','')::integer);
 select count(*) into accepted_count from public.public_registrations where tournament_id=tid and status in('accepted','imported');
 if cap is not null and accepted_count>=cap then st:='waitlist'; end if;

 insert into public.public_registrations(tournament_id,mode,primary_payload,partner_payload,primary_player_id,partner_player_id,status)
 values(tid,p_mode,primary_payload,partner_payload,pid1,pid2,st);

 return jsonb_build_object('ok',true,'already_registered',false,'status',st,
  'message',case when st='waitlist' then 'Posti esauriti: richiesta inserita in lista d’attesa.' else 'Richiesta inviata all’organizzatore.' end);
end$$;

revoke all on function public.public_search_players_for_registration(text,text) from public;
revoke all on function public.public_tournament_registration_list(text) from public;
revoke all on function public.public_submit_tournament_registration_request(text,text,jsonb,jsonb) from public;
grant execute on function public.public_search_players_for_registration(text,text) to anon,authenticated;
grant execute on function public.public_tournament_registration_list(text) to anon,authenticated;
grant execute on function public.public_submit_tournament_registration_request(text,text,jsonb,jsonb) to anon,authenticated;

-- PADEL ARENA MANAGER V8.1.17
-- Recupero non distruttivo: partecipanti, ricerca anagrafica e richieste duplicate.
-- Non elimina tornei, risultati, aste o gettoni.

alter table public.public_registrations add column if not exists primary_player_id text;
alter table public.public_registrations add column if not exists partner_player_id text;
alter table public.public_registrations add column if not exists updated_at timestamptz default now();

create or replace function public.pam_norm_text(v text)
returns text language sql immutable as $$
 select lower(regexp_replace(trim(coalesce(v,'')),'[^a-zA-ZÀ-ÿ0-9]+','','g'))
$$;

create or replace function public.pam_norm_phone(v text)
returns text language sql immutable as $$
 select regexp_replace(coalesce(v,''),'[^0-9]','','g')
$$;

create or replace function public.pam_player_missing_fields(d jsonb)
returns jsonb language sql immutable as $$
 select coalesce(jsonb_agg(k order by ord),'[]'::jsonb)
 from (values
  ('firstName',1),('lastName',2),('birth',3),('birthPlace',4),('postalCode',5),
  ('residenceTown',6),('residenceProvince',7),('phone',8),('email',9),('gender',10)
 ) x(k,ord)
 where nullif(trim(coalesce(d->>k,'')),'') is null
$$;

-- Riallinea gli ID memorizzati nei payload delle richieste.
update public.public_registrations
set primary_player_id=nullif(primary_payload->>'player_id','')
where primary_player_id is null and nullif(primary_payload->>'player_id','') is not null;

update public.public_registrations
set partner_player_id=nullif(partner_payload->>'player_id','')
where partner_player_id is null and partner_payload is not null and nullif(partner_payload->>'player_id','') is not null;

-- Ricrea in modo prudente eventuali anagrafiche referenziate ma mancanti,
-- usando i dati già presenti nella richiesta. Non sovrascrive anagrafiche esistenti.
insert into public.players(id,data)
select distinct r.primary_player_id,coalesce(r.primary_payload->'data','{}'::jsonb)
from public.public_registrations r
left join public.players p on p.id=r.primary_player_id
where r.primary_player_id is not null and p.id is null
on conflict(id) do nothing;

insert into public.players(id,data)
select distinct r.partner_player_id,coalesce(r.partner_payload->'data','{}'::jsonb)
from public.public_registrations r
left join public.players p on p.id=r.partner_player_id
where r.partner_player_id is not null and p.id is null
on conflict(id) do nothing;

-- Le funzioni TABLE/OUT vanno eliminate prima di cambiare struttura.
drop function if exists public.public_search_players_for_registration(text,text);
drop function if exists public.public_tournament_registration_list(text);

create function public.public_search_players_for_registration(
 p_share_token text,
 p_query text
)
returns table(id text,full_name text,missing_fields jsonb,registration_status text)
language plpgsql security definer set search_path=public as $$
begin
 if length(trim(coalesce(p_query,'')))<2 then return; end if;
 if not exists(
  select 1 from public.tournaments t
  where t.share_token=p_share_token and coalesce(t.status,'published')<>'cancelled'
 ) then raise exception 'Link torneo non valido.'; end if;

 return query
 with tr as (
  select t.id as tournament_id from public.tournaments t where t.share_token=p_share_token limit 1
 ), candidates as (
  select p.id as player_id,
   trim(concat_ws(' ',nullif(p.data->>'firstName',''),nullif(p.data->>'lastName',''))) as person_name,
   p.data as player_data,
   public.pam_norm_text(concat_ws(' ',p.data->>'firstName',p.data->>'lastName')) as name_key,
   row_number() over(
    partition by public.pam_norm_text(concat_ws(' ',p.data->>'firstName',p.data->>'lastName'))
    order by jsonb_array_length(public.pam_player_missing_fields(p.data)),p.updated_at desc nulls last,p.created_at desc nulls last
   ) as rn
  from public.players p
  where public.pam_norm_text(concat_ws(' ',p.data->>'firstName',p.data->>'lastName')) like '%'||public.pam_norm_text(p_query)||'%'
     or public.pam_norm_text(concat_ws(' ',p.data->>'lastName',p.data->>'firstName')) like '%'||public.pam_norm_text(p_query)||'%'
 )
 select c.player_id,c.person_name,public.pam_player_missing_fields(c.player_data),
  (
   select pr.status
   from public.public_registrations pr cross join tr
   where pr.tournament_id=tr.tournament_id and pr.status<>'rejected'
    and (
     pr.primary_player_id=c.player_id or pr.partner_player_id=c.player_id or
     nullif(pr.primary_payload->>'player_id','')=c.player_id or
     nullif(pr.partner_payload->>'player_id','')=c.player_id
    )
   order by pr.created_at desc limit 1
  )
 from candidates c
 where c.rn=1 and nullif(c.person_name,'') is not null
 order by c.person_name
 limit 30;
end$$;

create function public.public_tournament_registration_list(p_share_token text)
returns table(full_name text,status text,mode text,created_at timestamptz)
language sql security definer set search_path=public as $$
 with tr as (
  select t.id as tournament_id from public.tournaments t
  where t.share_token=p_share_token and coalesce(t.status,'published')<>'cancelled' limit 1
 ), rr as (
  select r.*,
   nullif(trim(concat_ws(' ',nullif(p1.data->>'firstName',''),nullif(p1.data->>'lastName',''))),'') as player_name_1,
   nullif(trim(concat_ws(' ',nullif(r.primary_payload#>>'{data,firstName}',''),nullif(r.primary_payload#>>'{data,lastName}',''))),'') as payload_name_1,
   nullif(trim(concat_ws(' ',nullif(p2.data->>'firstName',''),nullif(p2.data->>'lastName',''))),'') as player_name_2,
   nullif(trim(concat_ws(' ',nullif(r.partner_payload#>>'{data,firstName}',''),nullif(r.partner_payload#>>'{data,lastName}',''))),'') as payload_name_2
  from public.public_registrations r join tr on tr.tournament_id=r.tournament_id
  left join public.players p1 on p1.id=coalesce(r.primary_player_id,nullif(r.primary_payload->>'player_id',''))
  left join public.players p2 on p2.id=coalesce(r.partner_player_id,nullif(r.partner_payload->>'player_id',''))
  where r.status in('new','accepted','waitlist','imported')
 ), named as (
  select *,coalesce(player_name_1,payload_name_1,'Giocatore') as n1,coalesce(player_name_2,payload_name_2,'') as n2
  from rr
 ), ranked as (
  select *,row_number() over(
   partition by public.pam_norm_text(case when mode='pair' then concat_ws('|',n1,n2) else n1 end)
   order by case status when 'accepted' then 1 when 'imported' then 1 when 'waitlist' then 2 else 3 end,created_at desc
  ) as rn
  from named
 )
 select case when mode='pair' and nullif(n2,'') is not null then n1||' / '||n2 else n1 end,status,mode,created_at
 from ranked where rn=1 and nullif(n1,'') is not null
 order by case status when 'accepted' then 1 when 'imported' then 1 when 'new' then 2 when 'waitlist' then 3 else 4 end,created_at;
$$;

create or replace function public.admin_delete_public_registration(p_registration_id text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') then
  raise exception 'Operazione riservata all’amministratore';
 end if;
 delete from public.public_registrations where id=p_registration_id;
 return found;
end$$;

grant execute on function public.public_search_players_for_registration(text,text) to anon,authenticated;
grant execute on function public.public_tournament_registration_list(text) to anon,authenticated;
grant execute on function public.admin_delete_public_registration(text) to authenticated;
notify pgrst,'reload schema';

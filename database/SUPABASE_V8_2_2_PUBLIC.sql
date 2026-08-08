-- V8.2.2 LAB - funzioni pubbliche necessarie alla pagina iscrizione

create or replace function public.public_tournament_contact_info(p_share_token text)
returns table(organizer_name text, organizer_phone text, organizer_email text)
language sql security definer set search_path=public as $$
 select
  coalesce(t.data->>'organizerName','') as organizer_name,
  coalesce(t.data->>'organizerPhone','') as organizer_phone,
  coalesce(t.data->>'organizerEmail','') as organizer_email
 from public.tournaments t
 where t.share_token=p_share_token
   and coalesce(t.status,'published')<>'cancelled'
 limit 1;
$$;

create or replace function public.public_tournament_registration_list(p_share_token text)
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
   partition by lower(trim(case when mode='pair' then concat_ws('|',n1,n2) else n1 end))
   order by case status when 'accepted' then 1 when 'imported' then 1 when 'waitlist' then 2 else 3 end,created_at desc
  ) as rn
  from named
 )
 select case when mode='pair' and nullif(n2,'') is not null then n1||' / '||n2 else n1 end,status,mode,created_at
 from ranked where rn=1 and nullif(n1,'') is not null
 order by case status when 'accepted' then 1 when 'imported' then 1 when 'new' then 2 when 'waitlist' then 3 else 4 end,created_at;
$$;

grant execute on function public.public_tournament_contact_info(text) to anon,authenticated;
grant execute on function public.public_tournament_registration_list(text) to anon,authenticated;
notify pgrst,'reload schema';

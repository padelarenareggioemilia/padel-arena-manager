-- V8.2.3 LAB - contatti pubblici organizzatore
-- Eseguire UNA VOLTA in Supabase > SQL Editor.

create or replace function public.public_tournament_contact_info(p_share_token text)
returns table (organizer_name text, organizer_phone text, organizer_email text)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(t.data->>'organizerName','')::text as organizer_name,
    coalesce(t.data->>'organizerPhone','')::text as organizer_phone,
    coalesce(t.data->>'organizerEmail','')::text as organizer_email
  from public.tournaments t
  where t.share_token = p_share_token
    and coalesce(t.status,'published') = 'published'
  limit 1;
$$;

revoke all on function public.public_tournament_contact_info(text) from public;
grant execute on function public.public_tournament_contact_info(text) to anon, authenticated;

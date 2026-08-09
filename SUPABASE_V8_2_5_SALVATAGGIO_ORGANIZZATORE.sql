-- PADEL ARENA MANAGER V8.2.5
-- Eseguire UNA VOLTA in Supabase > SQL Editor.

create or replace function public.pam_set_tournament_organizer(
  p_tournament_id text,
  p_name text,
  p_phone text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
begin
  update public.tournaments
  set data = coalesce(data,'{}'::jsonb) || jsonb_build_object(
    'organizerName', coalesce(trim(p_name),''),
    'organizerPhone', coalesce(trim(p_phone),''),
    'organizerEmail', coalesce(trim(p_email),'')
  ),
  updated_at = now()
  where id::text = p_tournament_id
  returning data into v_data;

  if v_data is null then
    return jsonb_build_object('ok',false,'error','Torneo non trovato');
  end if;

  return jsonb_build_object(
    'ok',true,
    'organizerName',coalesce(v_data->>'organizerName',''),
    'organizerPhone',coalesce(v_data->>'organizerPhone',''),
    'organizerEmail',coalesce(v_data->>'organizerEmail','')
  );
end;
$$;

grant execute on function public.pam_set_tournament_organizer(text,text,text,text) to authenticated;
grant execute on function public.pam_set_tournament_organizer(text,text,text,text) to anon;

notify pgrst,'reload schema';

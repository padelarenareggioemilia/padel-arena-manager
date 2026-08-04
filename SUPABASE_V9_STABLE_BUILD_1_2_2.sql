-- AICS PADEL CHAMPIONSHIP V9 STABLE BUILD 1.2.2
-- CONTROLLO PUBBLICO EMAIL GIOCATORE SENZA ESPORRE DATI PERSONALI
begin;

create or replace function public.check_player_registration_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_email text := lower(trim(coalesce(p_email,'')));
  v_found boolean;
begin
  if v_email='' or position('@' in v_email)=0 then
    return jsonb_build_object('found',false);
  end if;

  select exists(
    select 1
    from public.roster_requests r
    where lower(trim(r.email))=v_email
      and r.status='approved'
  ) into v_found;

  return jsonb_build_object('found',v_found);
end;
$$;

revoke all on function public.check_player_registration_email(text) from public;
grant execute on function public.check_player_registration_email(text) to anon, authenticated;

commit;
notify pgrst,'reload schema';

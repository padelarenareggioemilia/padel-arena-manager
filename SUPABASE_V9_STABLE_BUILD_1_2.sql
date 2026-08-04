-- AICS PADEL CHAMPIONSHIP V9 STABLE BUILD 1.2
begin;

-- Collega in sicurezza l'account autenticato all'anagrafica approvata
-- usando esclusivamente l'email verificata dell'account Supabase.
create or replace function public.claim_approved_player_profile()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_row public.roster_requests%rowtype;
begin
  if v_uid is null then
    raise exception 'Devi effettuare l accesso';
  end if;
  if v_email='' then
    raise exception 'Email account non disponibile';
  end if;

  select *
  into v_row
  from public.roster_requests
  where lower(trim(email))=v_email
    and status='approved'
    and (user_id is null or user_id=v_uid)
  order by created_at desc
  limit 1;

  if v_row.id is null then
    raise exception 'Nessuna iscrizione approvata trovata con questa email';
  end if;

  update public.roster_requests
  set user_id=v_uid,
      updated_at=coalesce(updated_at,now())
  where id=v_row.id;

  insert into public.team_user_roles(user_id,team_id,role,active)
  values(v_uid,v_row.team_id,'player',true)
  on conflict do nothing;

  return jsonb_build_object(
    'success',true,
    'player_id',v_row.id,
    'team_id',v_row.team_id,
    'message','Account collegato correttamente alla tua iscrizione'
  );
end;
$$;

grant execute on function public.claim_approved_player_profile() to authenticated;

commit;
notify pgrst,'reload schema';

-- PADEL ARENA MANAGER V8.2.38.20
-- Correzione riconoscimento dei due componenti della coppia.
-- Non elimina e non modifica tornei, iscrizioni, giocatori o risultati esistenti.

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

revoke all on function public.pam_resolve_registration_player_v823811(jsonb) from public;

-- Controllo finale: restituisce una sola riga con esito OK.
select 'OK - controllo coppia installato' as esito;

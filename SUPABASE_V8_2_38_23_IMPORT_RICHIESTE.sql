-- PADEL ARENA MANAGER V8.2.38.23
-- Correzione identificazione giocatori durante la conferma delle richieste nazionali.
-- Eseguire una sola volta nel SQL Editor di Supabase.
-- Non elimina e non modifica tornei, iscrizioni, risultati o giocatori esistenti.

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
  player_first text := lower(trim(coalesce(p_person->'data'->>'firstName','')));
  player_last text := lower(trim(coalesce(p_person->'data'->>'lastName','')));
  player_birth text := trim(coalesce(p_person->'data'->>'birth',''));
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
    -- Prima scelta: stessa persona per nome, cognome e data di nascita.
    if player_first<>'' and player_last<>'' and player_birth<>'' then
      select id into player_id
      from public.players
      where lower(trim(coalesce(data->>'firstName','')))=player_first
        and lower(trim(coalesce(data->>'lastName','')))=player_last
        and trim(coalesce(data->>'birth',data->>'birthDate',''))=player_birth
      order by updated_at desc nulls last
      limit 1;
    end if;

    -- Contatti condivisi non bastano: telefono ed email valgono solo insieme al nome.
    if player_id is null and player_first<>'' and player_last<>'' and player_phone<>'' then
      select id into player_id
      from public.players
      where lower(trim(coalesce(data->>'firstName','')))=player_first
        and lower(trim(coalesce(data->>'lastName','')))=player_last
        and regexp_replace(coalesce(data->>'phone',''),'[^0-9]','','g')=player_phone
      order by updated_at desc nulls last
      limit 1;
    end if;

    if player_id is null and player_first<>'' and player_last<>'' and player_email<>'' then
      select id into player_id
      from public.players
      where lower(trim(coalesce(data->>'firstName','')))=player_first
        and lower(trim(coalesce(data->>'lastName','')))=player_last
        and lower(trim(coalesce(data->>'email','')))=player_email
      order by updated_at desc nulls last
      limit 1;
    end if;
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

grant execute on function public.pam_resolve_registration_player_v823811(jsonb) to authenticated;


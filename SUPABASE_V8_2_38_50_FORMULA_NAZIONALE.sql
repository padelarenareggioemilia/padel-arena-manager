-- V8.2.38.50 - Formula Campionati Nazionali 2026.
-- Aggiorna l'area pubblica con parziali dei 2 set, match tie-break e totali game.

create or replace function public.public_national_event_live(p_share_token text)
returns jsonb
language sql
security definer
stable
set search_path = ''
as $function$
  with parent_row as (
    select t.*
    from public.tournaments t
    where t.share_token = p_share_token
      and length(trim(p_share_token)) >= 8
      and t.competition_type = 'national_event'
      and t.status in ('published','active','registration_open','registration_closed')
    limit 1
  )
  select jsonb_build_object(
    'event', jsonb_build_object(
      'id', p.id,
      'name', coalesce(p.name, p.data->>'name'),
      'date', coalesce(p.event_date::text, p.data->>'date'),
      'start_time', p.data->>'startTime',
      'end_date', p.data->>'endDate',
      'end_time', p.data->>'endTime',
      'club', coalesce(p.club, p.data->>'club'),
      'registration_open', false
    ),
    'schedule', coalesce(p.data#>'{nationalSchedule,assignments}', '{}'::jsonb),
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'category', coalesce(c.data->>'nationalCategory', c.category),
          'pairs', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', pr.value->>'id',
                'group', coalesce(pr.value->>'group',''),
                'player1', coalesce((
                  select trim(concat_ws(' ', p1.data->>'firstName', p1.data->>'lastName'))
                  from public.players p1
                  where p1.id = pr.value#>>'{players,0}'
                ), 'Giocatore da definire'),
                'player2', coalesce((
                  select trim(concat_ws(' ', p2.data->>'firstName', p2.data->>'lastName'))
                  from public.players p2
                  where p2.id = pr.value#>>'{players,1}'
                ), 'Giocatore da definire')
              ) order by pr.ordinality)
            from jsonb_array_elements(coalesce(c.data->'pairs','[]'::jsonb)) with ordinality pr(value, ordinality)
          ), '[]'::jsonb),
          'matches', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', mt.value->>'id',
                'group', coalesce(mt.value->>'group', mt.value->>'round',''),
                'leg', coalesce(nullif(mt.value->>'leg','')::integer,1),
                'pair1', mt.value->>'pair1',
                'pair2', mt.value->>'pair2',
                'score1', case when mt.value->'score1' = 'null'::jsonb then null else mt.value->'score1' end,
                'score2', case when mt.value->'score2' = 'null'::jsonb then null else mt.value->'score2' end,
                'set_scores', coalesce(c.data#>array['matchOperations','match-'||(mt.value->>'id'),'setScores'], '[]'::jsonb),
                'match_tie_break', c.data#>array['matchOperations','match-'||(mt.value->>'id'),'matchTieBreak'],
                'game_totals', c.data#>array['matchOperations','match-'||(mt.value->>'id'),'gameTotals'],
                'started', coalesce((c.data#>>array['matchOperations','match-'||(mt.value->>'id'),'started'])::boolean,false)
              ) order by mt.ordinality)
            from jsonb_array_elements(coalesce(c.data->'matches','[]'::jsonb)) with ordinality mt(value, ordinality)
          ), '[]'::jsonb),
          'finals', coalesce(c.data->'fixedFinalsAdvanced','{}'::jsonb)
        )
        order by case coalesce(c.data->>'nationalCategory', c.category)
          when 'Maschile' then 1 when 'Femminile' then 2 when 'Misto' then 3 else 9 end
      )
      from public.tournaments c
      where c.data->>'nationalParentId' = p.id
        and c.status = 'internal'
    ), '[]'::jsonb)
  )
  from parent_row p;
$function$;

revoke all on function public.public_national_event_live(text) from public, anon, authenticated;
grant execute on function public.public_national_event_live(text) to anon, authenticated;

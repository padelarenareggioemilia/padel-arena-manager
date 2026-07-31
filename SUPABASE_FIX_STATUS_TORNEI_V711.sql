-- PADEL ARENA MANAGER 7.1.1
-- Correzione salvataggio tornei: stato non ammesso dal vincolo tournaments_status_check.

ALTER TABLE public.tournaments
DROP CONSTRAINT IF EXISTS tournaments_status_check;

ALTER TABLE public.tournaments
ADD CONSTRAINT tournaments_status_check
CHECK (status IN ('draft','published','active','closed','archived'));

UPDATE public.tournaments
SET status = 'published'
WHERE status IS NULL OR status = '';

NOTIFY pgrst, 'reload schema';

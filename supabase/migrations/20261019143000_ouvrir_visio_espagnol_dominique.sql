-- Paula 2026-10-19 : visio espagnol Dominique Langer ouverte.
-- Dates 27 oct.–19 nov. 2026 (mardi et jeudi). Créneau horaire non encore fixé.

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  instructor_label = 'Dominique Langer',
  updated_at = now()
WHERE session_code = 'S22';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ouvrir_visio_espagnol_dominique',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261019143000_ouvrir_visio_espagnol_dominique',
    'session_code', 'S22',
    'dates', '27, 29 oct. ; 3, 5, 10, 12, 17, 19 nov. 2026',
    'schedule', 'mardi et jeudi, horaire à préciser'
  )
);

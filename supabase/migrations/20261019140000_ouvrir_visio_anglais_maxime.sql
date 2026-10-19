-- Paula 2026-10-19 : visio anglais Maxime Goy confirmée.
-- Mardis et jeudis 18 h–21 h, 3–26 nov. 2026. Inscriptions ouvertes.

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  date_label = '3–26 nov. 2026 (mar. & jeu. 18 h–21 h)',
  format_label = 'Visio 24 h',
  instructor_label = 'Maxime Goy',
  updated_at = now()
WHERE session_code = 'S23';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ouvrir_visio_anglais_maxime',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261019140000_ouvrir_visio_anglais_maxime',
    'session_code', 'S23',
    'schedule', 'mardi et jeudi 18 h–21 h',
    'dates', '3, 5, 10, 12, 17, 19, 24, 26 nov. 2026'
  )
);

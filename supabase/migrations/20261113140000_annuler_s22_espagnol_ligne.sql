-- Paula 2026-11-13 : visio S22 Espagnol en ligne annulée par manque d'inscrits.
-- Soft-delete catalogue (/register) + cohorte planning → annulee.

UPDATE public.registration_offerings
SET
  is_active = false,
  updated_at = now()
WHERE session_code = 'S22'
  OR (
    modality_key = 'online_group'
    AND language_label = 'Espagnol'
    AND start_date = '2026-10-27'
    AND end_date = '2026-11-19'
  );

UPDATE public.sessions s
SET
  status = 'annulee',
  updated_at = now()
FROM public.registration_offerings ro
WHERE s.offering_id = ro.id
  AND (
    ro.session_code = 'S22'
    OR s.title ILIKE 'S22 ·%'
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'annuler_s22_espagnol_ligne',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261113110000_annuler_s22_espagnol_ligne',
    'session_code', 'S22',
    'reason', 'Paula : annulé par manque d''inscrits'
  )
);

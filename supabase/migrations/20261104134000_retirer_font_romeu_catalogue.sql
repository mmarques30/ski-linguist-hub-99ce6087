-- Paula 2026-11-04 : retirer ESF Font-Romeu (S04) du catalogue public /register.
-- Soft-delete : is_active = false (l'offre disparaît du formulaire et des listes actives).

UPDATE public.registration_offerings
SET
  is_active = false,
  updated_at = now()
WHERE session_code = 'S04'
   OR location_key = 'font-romeu';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'retirer_font_romeu_catalogue',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261104134000_retirer_font_romeu_catalogue',
    'session_code', 'S04',
    'location_key', 'font-romeu',
    'reason', 'Paula : enlever Font-Romeu du catalogue'
  )
);

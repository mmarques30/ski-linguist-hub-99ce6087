-- Paula 2026-10-01 : stages ESF Oz en Oisans confirmés → inscriptions ouvertes.
-- S07 Anglais + S08 Néerlandais (30 nov.–4 déc. 2026).

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  updated_at = now()
WHERE session_code IN ('S07', 'S08')
  AND location_key = 'oz-en-oisans'
  AND enrollment_status IS DISTINCT FROM 'open';

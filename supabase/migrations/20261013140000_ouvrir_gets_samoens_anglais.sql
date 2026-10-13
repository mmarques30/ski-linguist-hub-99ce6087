-- Paula 2026-10-13 : ouverture des inscriptions
-- S15/S16 ESF Les Gets (anglais + néerlandais) ; S13 ESF Samoëns anglais.
-- Tarif déjà en place : 800 € ESF partenaire, 900 € autres.
-- S21 Samoëns portugais reste en waitlist.

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  base_price = 900,
  partner_price = 800,
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  updated_at = now()
WHERE session_code IN ('S13', 'S15', 'S16')
  AND enrollment_status IS DISTINCT FROM 'open';

-- Garantir les codes partenaires même si une sync antérieure les a modifiés
UPDATE public.registration_offerings
SET
  partner_school_codes = ARRAY['esf-347']::text[],
  updated_at = now()
WHERE session_code IN ('S15', 'S16');

UPDATE public.registration_offerings
SET
  partner_school_codes = ARRAY['esf-599']::text[],
  updated_at = now()
WHERE session_code = 'S13';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ouvrir_gets_samoens_anglais',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261013140000_ouvrir_gets_samoens_anglais',
    'sessions', jsonb_build_array('S13', 'S15', 'S16'),
    'partner_price', 800,
    'base_price', 900,
    's21_samoens_pt', 'reste waitlist'
  )
);

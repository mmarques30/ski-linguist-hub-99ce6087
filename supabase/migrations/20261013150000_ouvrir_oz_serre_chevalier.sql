-- Paula 2026-10-13 : ouverture Oz en Oisans + Serre Chevalier.
-- S07/S08 ESF Oz : 800 € partenaire (esf-523), 900 € autres.
-- S09 Serre Chevalier : 850 € les quatre ESF station, 950 € autres ; inscriptions ouvertes.

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  base_price = 900,
  partner_price = 800,
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  partner_school_codes = ARRAY['esf-523']::text[],
  updated_at = now()
WHERE session_code IN ('S07', 'S08');

UPDATE public.registration_offerings
SET
  enrollment_status = 'open',
  base_price = 950,
  partner_price = 850,
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  partner_school_codes = ARRAY['esf-210', 'esf-620', 'esf-437', 'esf-623']::text[],
  updated_at = now()
WHERE session_code = 'S09';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'ouvrir_oz_serre_chevalier',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261013150000_ouvrir_oz_serre_chevalier',
    'oz', jsonb_build_object('sessions', jsonb_build_array('S07', 'S08'), 'partner_price', 800, 'base_price', 900),
    'serre_chevalier', jsonb_build_object('session', 'S09', 'partner_price', 850, 'base_price', 950)
  )
);

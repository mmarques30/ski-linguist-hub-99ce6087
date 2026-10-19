-- Paula 2026-10-19 : tarif réduit 800 € élargi aux ESF du secteur
-- Châtel (S12), Les Gets (S15, S16) et Samoëns anglais (S13).
-- ESI, Evolution 2 et écoles « Autre » restent au tarif 900 €.
-- S21 Samoëns portugais (forfait école) inchangé.

UPDATE public.registration_offerings
SET
  partner_school_codes = ARRAY[
    'esf-101',
    'esf-140',
    'esf-176',
    'esf-254',
    'esf-260',
    'esf-320',
    'esf-347',
    'esf-361',
    'esf-460',
    'esf-467',
    'esf-470',
    'esf-599'
  ]::text[],
  partner_price = 800,
  base_price = 900,
  partner_price_alt = NULL,
  partner_price_pending = false,
  updated_at = now()
WHERE session_code IN ('S12', 'S13', 'S15', 'S16');

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'tarif_reduit_esf_vallee',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261019120000_tarif_reduit_esf_vallee',
    'sessions', jsonb_build_array('S12', 'S13', 'S15', 'S16'),
    'partner_price', 800,
    'base_price', 900,
    'esf_only', true
  )
);

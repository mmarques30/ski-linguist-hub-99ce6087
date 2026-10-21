-- Paula 2026-10-21 : stages Val d'Isère (S03 portugais, S05 anglais)
-- Tarif partenaire 800 € pour l'ESF Val d'Isère (esf-671), 900 € pour les autres.

UPDATE public.registration_offerings
SET
  partner_school_codes = ARRAY['esf-671']::text[],
  partner_price = 800,
  base_price = 900,
  partner_price_alt = NULL,
  partner_price_pending = false,
  updated_at = now()
WHERE session_code IN ('S03', 'S05');

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'tarif_val_disere_esf_800',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261021150800_tarif_val_disere_esf_800',
    'sessions', jsonb_build_array('S03', 'S05'),
    'partner_price', 800,
    'base_price', 900,
    'partner_school_codes', jsonb_build_array('esf-671')
  )
);

-- Châtel (S12) : l'ESF ne fournit pas le logement (décision 06/10/2026).
-- Tarif partenaire unique 800 € ; plus d'attente 750/800 ni inscription sans paiement.

UPDATE public.registration_offerings
SET
  base_price = 900,
  partner_price = 800,
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  updated_at = now()
WHERE session_code = 'S12';

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'tarifs_chatel_800',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261006120000_chatel_tarif_800',
    'session_code', 'S12',
    'partner_price', 800,
    'reason', 'ESF Châtel ne fournit pas le logement'
  )
);

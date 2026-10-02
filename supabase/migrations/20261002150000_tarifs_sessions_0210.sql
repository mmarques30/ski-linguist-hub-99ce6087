-- Décisions tarifaires du 02/10/2026 (SESSIONS_2026_2027.md) :
-- Val Cenis tarif unique 750 € ; Châtel tarif partenaire conditionnel 750/800 ;
-- modes de financement Méribel / La Rosière / Samoëns portugais.

ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS funding_mode text NOT NULL DEFAULT 'individuel',
  ADD COLUMN IF NOT EXISTS partner_price_alt numeric,
  ADD COLUMN IF NOT EXISTS partner_price_pending boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_offerings_funding_mode_check'
  ) THEN
    ALTER TABLE public.registration_offerings
      ADD CONSTRAINT registration_offerings_funding_mode_check
      CHECK (funding_mode IN ('individuel', 'forfait_ecole', 'fifpl_stagiaire_solde_ecole'));
  END IF;
END $$;

COMMENT ON COLUMN public.registration_offerings.funding_mode IS
  'individuel | forfait_ecole | fifpl_stagiaire_solde_ecole — règles paiement /register §3';
COMMENT ON COLUMN public.registration_offerings.partner_price_alt IS
  'Second tarif partenaire si logistique non tranchée (ex. Châtel 800 sans studio)';
COMMENT ON COLUMN public.registration_offerings.partner_price_pending IS
  'true = tarif partenaire non définitif ; inscription sans paiement (en attente tarif)';

-- Val Cenis (S17, S18) : 750 € toutes écoles
UPDATE public.registration_offerings
SET
  base_price = 750,
  partner_price = 750,
  partner_price_alt = NULL,
  partner_price_pending = false,
  funding_mode = 'individuel',
  updated_at = now()
WHERE session_code IN ('S17', 'S18');

-- Châtel (S12) : 750 si studio ESF, 800 sinon ; autres 900 ; inscription partenaire sans paiement
UPDATE public.registration_offerings
SET
  base_price = 900,
  partner_price = 750,
  partner_price_alt = 800,
  partner_price_pending = true,
  funding_mode = 'individuel',
  updated_at = now()
WHERE session_code = 'S12';

-- Méribel (S06, S14) : forfait école, pas d'acompte 150 €
UPDATE public.registration_offerings
SET
  funding_mode = 'forfait_ecole',
  partner_price_pending = false,
  partner_price_alt = NULL,
  updated_at = now()
WHERE session_code IN ('S06', 'S14');

-- La Rosière (S10) : FIF-PL stagiaire + solde école, pas d'acompte
UPDATE public.registration_offerings
SET
  funding_mode = 'fifpl_stagiaire_solde_ecole',
  partner_price_pending = false,
  partner_price_alt = NULL,
  updated_at = now()
WHERE session_code = 'S10';

-- Samoëns portugais (S21) : forfait école
UPDATE public.registration_offerings
SET
  funding_mode = 'forfait_ecole',
  partner_price_pending = false,
  partner_price_alt = NULL,
  updated_at = now()
WHERE session_code = 'S21';

-- Défaut raisonnable pour le reste du catalogue ouvert
UPDATE public.registration_offerings
SET funding_mode = 'individuel'
WHERE funding_mode IS NULL
   OR funding_mode NOT IN ('individuel', 'forfait_ecole', 'fifpl_stagiaire_solde_ecole');

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'tarifs_sessions_0210',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261002150000_tarifs_sessions_0210',
    'val_cenis', '750 unique',
    'chatel', '750/800 pending',
    'meribel', 'forfait_ecole no deposit',
    'la_rosiere', 'fifpl_stagiaire_solde_ecole no deposit'
  )
);

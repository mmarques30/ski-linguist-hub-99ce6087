-- Paula 2026-11-10 : tarif 900 € pour les anciens stagiaires FLI
-- à Saint-Jean-de-Maurienne (S02), afin qu'il n'y ait pas de reste à charge
-- quand le FIF-PL couvre 900 €. Tarif catalogue général inchangé (950 €).

ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS alumni_price numeric;

COMMENT ON COLUMN public.registration_offerings.alumni_price IS
  'Tarif réservé aux anciens stagiaires FLI de ce lieu (ex. Saint-Jean 900 €) ; sinon base_price / partner_price.';

UPDATE public.registration_offerings
SET
  alumni_price = 900,
  updated_at = now()
WHERE session_code = 'S02'
  AND is_active = true;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'catalogue_saint_jean_alumni_price',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261110100000_saint_jean_alumni_price_900',
    'session_code', 'S02',
    'location', 'Saint-Jean-de-Maurienne',
    'alumni_price', 900,
    'base_price_unchanged', 950
  )
);

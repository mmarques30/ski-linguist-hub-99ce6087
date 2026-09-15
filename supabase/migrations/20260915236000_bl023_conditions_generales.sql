-- BL-023 — les conditions générales doivent être lisibles avant la case à cocher.
--
-- Recette du 11 → 15/09 : « J'accepte les conditions générales » ne donnait
-- accès à aucun texte. Les liens de l'étape 7 pointaient vers deux PDF absents
-- de `public/registration-documents/` : ils répondaient 404.
--
-- Les conditions générales sont désormais une page publique de l'application
-- (`/conditions-generales`). Elle affiche l'identité de l'organisme saisie dans
-- `/settings` (BL-036), donc `app_settings.fli_identity` doit être lisible sans
-- être connecté. La politique existante ne couvrait que `authenticated`.
--
-- Seule cette clé est ouverte : le reste d'`app_settings` (secret Stripe,
-- plancher de facturation, gel de prospection…) reste réservé au personnel.

DROP POLICY IF EXISTS "Public can view organisation identity" ON public.app_settings;

CREATE POLICY "Public can view organisation identity"
  ON public.app_settings
  FOR SELECT
  TO anon
  USING (key = 'fli_identity');

-- Vérification : la politique anonyme n'ouvre que l'identité.
DO $$
DECLARE
  expression text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid)
    INTO expression
  FROM pg_policy
  WHERE polrelid = 'public.app_settings'::regclass
    AND polname = 'Public can view organisation identity';

  IF expression IS NULL OR expression NOT LIKE '%fli_identity%' THEN
    RAISE EXCEPTION 'BL-023 : la politique anonyme sur app_settings n''est pas restreinte à fli_identity (%)', expression;
  END IF;
END $$;

-- DOWN (ne pas exécuter sans validation Paula) :
-- DROP POLICY IF EXISTS "Public can view organisation identity" ON public.app_settings;

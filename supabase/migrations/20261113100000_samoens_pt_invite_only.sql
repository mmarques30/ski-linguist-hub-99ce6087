-- Paula 2026-11-13 : Samoëns portugais (S21) — inscription sur invitation.
-- Liste ESF : formulaire allégé (coordonnées + test + attentes), sans paiement.
-- Nicole Bottollier : invitée aussi pour le test / groupes ; règlement hors ESF (mail à part).

-- 1) enrollment_status : invite_only
ALTER TABLE public.registration_offerings
  DROP CONSTRAINT IF EXISTS registration_offerings_enrollment_status_check;

ALTER TABLE public.registration_offerings
  ADD CONSTRAINT registration_offerings_enrollment_status_check
  CHECK (enrollment_status IN ('open', 'waitlist', 'invite_only'));

COMMENT ON COLUMN public.registration_offerings.enrollment_status IS
  'open = inscription libre ; waitlist = contact rappel ; invite_only = e-mails whitelistés';

-- 2) Pas de paiement stagiaire (forfait école / liste fermée)
ALTER TABLE public.registration_offerings
  ADD COLUMN IF NOT EXISTS student_payment_required boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.registration_offerings.student_payment_required IS
  'false = formulaire sans étape paiement (ex. forfait ESF Samoëns PT)';

-- 3) Whitelist e-mails
CREATE TABLE IF NOT EXISTS public.registration_offering_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.registration_offerings(id) ON DELETE CASCADE,
  email text NOT NULL,
  civility text,
  first_name text,
  last_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registration_offering_invites_email_nonempty
    CHECK (length(trim(email)) > 3 AND position('@' in email) > 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS registration_offering_invites_offering_email_uidx
  ON public.registration_offering_invites (offering_id, lower(trim(email)));

CREATE INDEX IF NOT EXISTS registration_offering_invites_email_idx
  ON public.registration_offering_invites (lower(trim(email)));

COMMENT ON TABLE public.registration_offering_invites IS
  'E-mails autorisés pour une offre invite_only (/register?session=…)';

ALTER TABLE public.registration_offering_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_registration_invites_staff_all" ON public.registration_offering_invites;
CREATE POLICY "rls_registration_invites_staff_all"
  ON public.registration_offering_invites
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Anon / authenticated : pas de SELECT direct — uniquement via RPC (évite fuite de la liste).

CREATE OR REPLACE FUNCTION public.normalize_registration_invite_email(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(COALESCE(p_email, '')));
$$;

CREATE OR REPLACE FUNCTION public.check_registration_invite(
  p_offering_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := public.normalize_registration_invite_email(p_email);
  v_status text;
BEGIN
  IF p_offering_id IS NULL OR v_email = '' OR position('@' in v_email) < 2 THEN
    RETURN false;
  END IF;

  SELECT enrollment_status INTO v_status
  FROM public.registration_offerings
  WHERE id = p_offering_id
    AND is_active = true;

  IF v_status IS NULL THEN
    RETURN false;
  END IF;

  -- Offres ouvertes : pas de whitelist.
  IF v_status IS DISTINCT FROM 'invite_only' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.registration_offering_invites i
    WHERE i.offering_id = p_offering_id
      AND public.normalize_registration_invite_email(i.email) = v_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_registration_invite(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_registration_invite(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_registration_invite_profile(
  p_offering_id uuid,
  p_email text
)
RETURNS TABLE (
  email text,
  civility text,
  first_name text,
  last_name text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := public.normalize_registration_invite_email(p_email);
BEGIN
  IF NOT public.check_registration_invite(p_offering_id, v_email) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    public.normalize_registration_invite_email(i.email),
    i.civility,
    i.first_name,
    i.last_name,
    i.notes
  FROM public.registration_offering_invites i
  WHERE i.offering_id = p_offering_id
    AND public.normalize_registration_invite_email(i.email) = v_email
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_registration_invite_profile(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_registration_invite_profile(uuid, text) TO anon, authenticated;

-- 4) Ouvrir S21 en invite_only, sans paiement stagiaire
UPDATE public.registration_offerings
SET
  enrollment_status = 'invite_only',
  student_payment_required = false,
  funding_mode = 'forfait_ecole',
  is_active = true,
  updated_at = now()
WHERE session_code = 'S21'
   OR (location_key = 'samoens' AND language_key = 'portuguese');

-- 5) Whitelist (22 personnes — Nicole notée paiement individuel hors ESF)
WITH s21 AS (
  SELECT id
  FROM public.registration_offerings
  WHERE session_code = 'S21'
  LIMIT 1
),
invitees(civility, last_name, first_name, email, notes) AS (
  VALUES
    ('Madame', 'BOTTOLLIER-CURTET', 'NICOLE', 'bcrnicole@orange.fr', 'paiement individuel — hors forfait ESF'),
    ('Monsieur', 'BOUVIER', 'MICHAEL', 'mikbouv@live.fr', NULL),
    ('Madame', 'CARLES', 'CHRISTINE', 'christinecarles0303@gmail.com', NULL),
    ('Monsieur', 'CHAUSSADE', 'TANGUY', 'tanguy.chaussade18@gmail.com', NULL),
    ('Mademoiselle', 'CRUZ', 'EMILIE', 'cruz.emilie.ce@gmail.com', NULL),
    ('Madame', 'DAVERGNE', 'CAMILLE', 'camilledavergne@icloud.com', NULL),
    ('Mademoiselle', 'DAVERGNE', 'MARION', 'mariondavergne@icloud.com', NULL),
    ('Madame', 'DEBOIS', 'ZOE', 'zoedebois@gmail.com', NULL),
    ('Madame', 'DELAHAYE', 'ANNE', 'delahayeanne.2l@gmail.com', NULL),
    ('Mademoiselle', 'DUCHOSAL', 'ANOUCK', 'anouckduchosal@live.com', NULL),
    ('Monsieur', 'DUCHOSAL', 'ETIENNE', 'etienne.duchosal@gmail.com', NULL),
    ('Monsieur', 'FOURCADE', 'BENJAMIN', 'benfourcade64@hotmail.fr', NULL),
    ('Madame', 'LEROY', 'Lucie', 'lucileklufts@yahoo.fr', NULL),
    ('Madame', 'NARDELLI', 'PASCALE', 'elacsap1@hotmail.fr', NULL),
    ('Monsieur', 'ORSAT', 'HUGO', 'hugo.orsat7409@gmail.com', NULL),
    ('Monsieur', 'PARRAT', 'DAVID', 'david.parrat@gmail.com', NULL),
    ('Mademoiselle', 'PEREZ', 'MARION', 'marionperez.ffs@gmail.com', NULL),
    ('Monsieur', 'PICONE', 'OLIVIER', 'olivier.picone@gmail.com', NULL),
    ('Monsieur', 'RICHARD', 'GREGORY', 'gregory.richard4@hotmail.fr', NULL),
    ('Monsieur', 'RIMBAULT', 'ADRIEN', 'adrien.rimbault@gmail.com', NULL),
    ('Mademoiselle', 'TERRASSON', 'KATIE', 'katterrasson@gmail.com', NULL),
    ('Monsieur', 'VASSAL', 'XAVIER', 'xavier.vassal@wanadoo.fr', NULL)
)
INSERT INTO public.registration_offering_invites (
  offering_id, email, civility, first_name, last_name, notes
)
SELECT
  s21.id,
  lower(trim(i.email)),
  i.civility,
  i.first_name,
  i.last_name,
  i.notes
FROM s21
CROSS JOIN invitees i
WHERE NOT EXISTS (
  SELECT 1
  FROM public.registration_offering_invites existing
  WHERE existing.offering_id = s21.id
    AND public.normalize_registration_invite_email(existing.email)
      = public.normalize_registration_invite_email(i.email)
);

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'samoens_pt_invite_only',
  'registration_offerings',
  jsonb_build_object(
    'migration', '20261113100000_samoens_pt_invite_only',
    'session_code', 'S21',
    'enrollment_status', 'invite_only',
    'student_payment_required', false,
    'invite_count', 22,
    'register_link', 'https://www.fli.fr/register?session=S21'
  )
);

-- C.2 — sponsor_type / sponsor_id + schéma évaluations + RLS candidat
-- Script de retour : docs/POINT_C2_SPONSOR_TYPE.md
--
-- Source de vérité du commanditaire : test_bookings.sponsor_type
--   (esf | ecole_ski | dsf). Plus d'inférence ski_schools / partners dans RLS.
-- attestation_type est conservé (le formulaire actuel l'envoie encore) ;
-- DROP prévu C.3 / C.5.

-- ---------------------------------------------------------------------------
-- 1. test_bookings.sponsor_type / sponsor_id
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_bookings
  ADD COLUMN IF NOT EXISTS sponsor_type text NOT NULL DEFAULT 'ecole_ski';

ALTER TABLE public.test_bookings
  ADD COLUMN IF NOT EXISTS sponsor_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_bookings_sponsor_type_check'
  ) THEN
    ALTER TABLE public.test_bookings
      ADD CONSTRAINT test_bookings_sponsor_type_check
      CHECK (sponsor_type IN ('esf', 'ecole_ski', 'dsf'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_test_bookings_sponsor_type
  ON public.test_bookings (sponsor_type);

COMMENT ON COLUMN public.test_bookings.sponsor_type IS
  'Commanditaire du test : esf | ecole_ski | dsf. Source de vérité RLS / PDF (C.5).';
COMMENT ON COLUMN public.test_bookings.sponsor_id IS
  'UUID du commanditaire (ski_schools.id si esf/ecole_ski, partners.id si dsf connu). Pas de FK unique.';

-- Backfill depuis candidat → école → partenaire (0 ligne aujourd'hui ; conservé pour replay).
UPDATE public.test_bookings b
SET
  sponsor_type = CASE
    WHEN lower(coalesce(p.type, '')) IN (
      'dsf', 'domaines_skiables', 'domaines skiables de france'
    )
      OR lower(coalesce(s.school_kind, '')) IN (
        'dsf', 'domaines_skiables', 'remontees_mecaniques'
      )
      THEN 'dsf'
    WHEN lower(coalesce(s.school_kind, '')) = 'esf' THEN 'esf'
    ELSE 'ecole_ski'
  END,
  sponsor_id = CASE
    WHEN lower(coalesce(p.type, '')) IN (
      'dsf', 'domaines_skiables', 'domaines skiables de france'
    )
      OR lower(coalesce(s.school_kind, '')) IN (
        'dsf', 'domaines_skiables', 'remontees_mecaniques'
      )
      THEN coalesce(p.id, s.id)
    ELSE s.id
  END
FROM public.test_candidates c
LEFT JOIN public.ski_schools s ON s.id = c.ski_school_id
LEFT JOIN public.partners p ON p.id = s.partner_id
WHERE c.id = b.candidate_id;

-- ---------------------------------------------------------------------------
-- 2. test_evaluations : statut, blocs, note méthodologique, score calculé
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'brouillon';

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS note_methodologique text;

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS cecrl_label text;

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS bloc_introduction text;

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS bloc_comprehension text;

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS bloc_technique text;

ALTER TABLE public.test_evaluations
  ADD COLUMN IF NOT EXISTS bloc_conclusion text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'test_evaluations'
      AND column_name = 'score_general_calcule'
  ) THEN
    ALTER TABLE public.test_evaluations
      ADD COLUMN score_general_calcule numeric
      GENERATED ALWAYS AS (
        round((
          score_comprehension
          + score_expression
          + score_structure
          + score_technique
          + score_conversation
        ) / 5.0 * 2) / 2.0
      ) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_evaluations_status_check'
  ) THEN
    ALTER TABLE public.test_evaluations
      ADD CONSTRAINT test_evaluations_status_check
      CHECK (status IN ('brouillon', 'a_verifier', 'valide', 'envoye'));
  END IF;
END $$;

-- 0–5 par pas de 0,5. Conservé en plus des CHECK >= 0 historiques.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_evaluations_scores_half_step_check'
  ) THEN
    ALTER TABLE public.test_evaluations
      ADD CONSTRAINT test_evaluations_scores_half_step_check
      CHECK (
        score_comprehension BETWEEN 0 AND 5
        AND (score_comprehension * 2) = trunc(score_comprehension * 2)
        AND score_expression BETWEEN 0 AND 5
        AND (score_expression * 2) = trunc(score_expression * 2)
        AND score_structure BETWEEN 0 AND 5
        AND (score_structure * 2) = trunc(score_structure * 2)
        AND score_technique BETWEEN 0 AND 5
        AND (score_technique * 2) = trunc(score_technique * 2)
        AND score_conversation BETWEEN 0 AND 5
        AND (score_conversation * 2) = trunc(score_conversation * 2)
        AND score_general BETWEEN 0 AND 5
        AND (score_general * 2) = trunc(score_general * 2)
      );
  END IF;
END $$;

-- Ajustement |général − calculé| ≤ 1 + note obligatoire : hors brouillon
-- pour que le formulaire actuel (C.3) puisse encore insérer un brouillon.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_evaluations_score_adjust_check'
  ) THEN
    ALTER TABLE public.test_evaluations
      ADD CONSTRAINT test_evaluations_score_adjust_check
      CHECK (
        status = 'brouillon'
        OR abs(score_general - score_general_calcule) <= 1
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'test_evaluations_note_methodo_check'
  ) THEN
    ALTER TABLE public.test_evaluations
      ADD CONSTRAINT test_evaluations_note_methodo_check
      CHECK (
        status = 'brouillon'
        OR abs(score_general - score_general_calcule) = 0
        OR (
          note_methodologique IS NOT NULL
          AND length(btrim(note_methodologique)) > 0
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.test_evaluations.status IS
  'brouillon | a_verifier | valide | envoye. Défaut brouillon (insert UI actuel).';
COMMENT ON COLUMN public.test_evaluations.score_general_calcule IS
  'Moyenne des cinq notes, arrondie au demi-point le plus proche.';
COMMENT ON COLUMN public.test_evaluations.note_methodologique IS
  'Obligatoire hors brouillon si score_general ≠ score_general_calcule.';

-- Reprise des 4 blocs depuis les anciens champs (appreciation_* prioritaire).
UPDATE public.test_evaluations
SET
  bloc_introduction = coalesce(
    nullif(btrim(bloc_introduction), ''),
    nullif(btrim(appreciation_intro), ''),
    nullif(btrim(comments_introduction), '')
  ),
  bloc_comprehension = coalesce(
    nullif(btrim(bloc_comprehension), ''),
    nullif(btrim(appreciation_comprehension), ''),
    nullif(btrim(comments_comprehension), '')
  ),
  bloc_technique = coalesce(
    nullif(btrim(bloc_technique), ''),
    nullif(btrim(appreciation_technique), ''),
    nullif(btrim(comments_technique), '')
  ),
  bloc_conclusion = coalesce(
    nullif(btrim(bloc_conclusion), ''),
    nullif(btrim(appreciation_conclusion), ''),
    nullif(btrim(comments_conclusion), '')
  )
WHERE
  bloc_introduction IS NULL
  OR bloc_comprehension IS NULL
  OR bloc_technique IS NULL
  OR bloc_conclusion IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Échelle CECRL — 11 lignes, 0.0 A1 … 5.0 C2
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cecrl_scale (
  score numeric(2, 1) PRIMARY KEY,
  cecrl_label text NOT NULL,
  CONSTRAINT cecrl_scale_score_check
    CHECK (score >= 0 AND score <= 5 AND (score * 2) = trunc(score * 2))
);

COMMENT ON TABLE public.cecrl_scale IS
  'Correspondance naturelle note / 5 → CECRL. Ne pas inventer d''autres seuils.';

INSERT INTO public.cecrl_scale (score, cecrl_label) VALUES
  (0.0, 'A1'),
  (0.5, 'A1+'),
  (1.0, 'A2'),
  (1.5, 'A2+'),
  (2.0, 'B1'),
  (2.5, 'B1+'),
  (3.0, 'B2'),
  (3.5, 'B2+'),
  (4.0, 'C1'),
  (4.5, 'C1+'),
  (5.0, 'C2')
ON CONFLICT (score) DO UPDATE SET cecrl_label = EXCLUDED.cecrl_label;

ALTER TABLE public.cecrl_scale ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rls_cecrl_scale_select" ON public.cecrl_scale;
CREATE POLICY "rls_cecrl_scale_select" ON public.cecrl_scale
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.is_formateur());

DROP POLICY IF EXISTS "rls_cecrl_scale_write_staff" ON public.cecrl_scale;
CREATE POLICY "rls_cecrl_scale_write_staff" ON public.cecrl_scale
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

GRANT SELECT ON public.cecrl_scale TO authenticated;

CREATE OR REPLACE FUNCTION public.cecrl_label_from_score(_score numeric)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT cecrl_label FROM public.cecrl_scale WHERE score = _score LIMIT 1
$function$;

GRANT EXECUTE ON FUNCTION public.cecrl_label_from_score(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.test_evaluations_set_cecrl_label()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cecrl_label IS NULL OR btrim(NEW.cecrl_label) = '' THEN
    NEW.cecrl_label := public.cecrl_label_from_score(NEW.score_general);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_test_evaluations_cecrl_label ON public.test_evaluations;
CREATE TRIGGER trg_test_evaluations_cecrl_label
  BEFORE INSERT OR UPDATE OF score_general, cecrl_label
  ON public.test_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.test_evaluations_set_cecrl_label();

-- ---------------------------------------------------------------------------
-- 4. test_booking_is_dsf : lit sponsor_type (plus d'inférence école / partenaire)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.test_booking_is_dsf(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_bookings b
    WHERE b.id = _booking_id
      AND b.sponsor_type = 'dsf'
  )
$function$;

GRANT EXECUTE ON FUNCTION public.test_booking_is_dsf(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Politiques candidat : plus d'attestation_type ; DSF = sponsor_type
--    Staff / formateur C.1 inchangés.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "rls_test_evaluations_select_candidate" ON public.test_evaluations;
CREATE POLICY "rls_test_evaluations_select_candidate" ON public.test_evaluations
  FOR SELECT TO authenticated USING (
    public.is_student()
    AND public.owns_test_booking(booking_id)
    AND NOT public.test_booking_is_dsf(booking_id)
  );

DROP POLICY IF EXISTS "rls_test_bookings_select_candidate" ON public.test_bookings;
CREATE POLICY "rls_test_bookings_select_candidate" ON public.test_bookings
  FOR SELECT TO authenticated USING (
    public.is_student()
    AND public.owns_test_booking(id)
    AND NOT public.test_booking_is_dsf(id)
  );

-- ---------------------------------------------------------------------------
-- 6. Vue test_bookings_complete : colonnes ajoutées en fin (CREATE OR REPLACE)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.test_bookings_complete
WITH (security_invoker = true)
AS
SELECT
  tb.id,
  tb.candidate_id,
  tb.instructor_id,
  tb.language,
  tb.datetime,
  tb.status,
  tb.payment_type,
  tb.stripe_payment_id,
  tb.google_meet_link,
  tb.google_event_id,
  tb.previous_test,
  tb.previous_result,
  tb.source,
  tb.created_at,
  tc.name AS candidate_name,
  tc.email AS candidate_email,
  tc.phone AS candidate_phone,
  tc.profession AS candidate_profession,
  tc.photo_face_url AS candidate_photo,
  tc.student_id,
  ss.name AS ski_school_name,
  ss.id AS ski_school_id,
  CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
  i.email AS instructor_email,
  te.id AS evaluation_id,
  te.score_general,
  te.attestation_url,
  te.attestation_sent_at,
  tb.sponsor_type,
  tb.sponsor_id
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);

GRANT SELECT ON public.test_bookings_complete TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c2_sponsor_type',
  'test_bookings',
  jsonb_build_object(
    'migration', '20260911120000_c2_sponsor_type',
    'point', 'C.2',
    'sponsor_type', 'esf|ecole_ski|dsf',
    'test_booking_is_dsf', 'sponsor_type = dsf',
    'candidate_rls', 'owns_test_booking AND NOT test_booking_is_dsf (attestation_type retiré)',
    'cecrl_scale_rows', 11,
    'attestation_type_kept', true
  )
);

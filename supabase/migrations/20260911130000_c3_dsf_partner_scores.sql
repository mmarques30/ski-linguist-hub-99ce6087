-- C.3 — compléments C.2 + vue statut évaluation
-- Partenaire DSF (exception gel point 5), FK sponsor_id, contrainte notes,
-- colonnes CECRL de base. Script de retour : docs/POINT_C3_SAISIE_FORMATEUR.md

-- ---------------------------------------------------------------------------
-- 1. Exception gel : une seule ligne partners DSF, journalisée
-- ---------------------------------------------------------------------------

ALTER TABLE public.partners DISABLE TRIGGER gel_prospection_partners;

INSERT INTO public.partners (name, type, status)
SELECT 'Domaines Skiables de France', 'dsf', 'actif'
WHERE NOT EXISTS (
  SELECT 1 FROM public.partners
  WHERE type = 'dsf'
    AND name = 'Domaines Skiables de France'
);

ALTER TABLE public.partners ENABLE TRIGGER gel_prospection_partners;

CREATE OR REPLACE FUNCTION public.dsf_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.partners
  WHERE type = 'dsf'
    AND name = 'Domaines Skiables de France'
  LIMIT 1
$function$;

GRANT EXECUTE ON FUNCTION public.dsf_partner_id() TO authenticated;

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'dsf_partner',
  jsonb_build_object(
    'name', 'Domaines Skiables de France',
    'type', 'dsf',
    'exception_gel', true,
    'point', 'C.3',
    'id', public.dsf_partner_id()
  ),
  'Partenaire DSF — exception explicite au gel point 5 (C.3)'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'exception_gel_partenaire_dsf',
  'partners',
  jsonb_build_object(
    'migration', '20260911130000_c3_dsf_partner_scores',
    'point', 'C.3',
    'gel', 'point 5 — exception unique, trigger rétabli',
    'name', 'Domaines Skiables de France',
    'type', 'dsf',
    'partner_id', public.dsf_partner_id()
  )
);

-- Réservations DSF existantes (0 aujourd'hui) pointent vers cette ligne.
UPDATE public.test_bookings
SET sponsor_id = public.dsf_partner_id()
WHERE sponsor_type = 'dsf'
  AND (sponsor_id IS NULL OR sponsor_id IS DISTINCT FROM public.dsf_partner_id());

-- ---------------------------------------------------------------------------
-- 2. FK sponsor_id → partners.id (nullable : esf/ecole_ski sans partenaire)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'test_bookings_sponsor_id_fkey'
  ) THEN
    ALTER TABLE public.test_bookings
      ADD CONSTRAINT test_bookings_sponsor_id_fkey
      FOREIGN KEY (sponsor_id) REFERENCES public.partners(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

COMMENT ON COLUMN public.test_bookings.sponsor_id IS
  'FK partners.id. DSF = partenaire « Domaines Skiables de France ». esf/ecole_ski : partenaire lié ou NULL.';

-- ---------------------------------------------------------------------------
-- 3. CECRL : label de base + contrôle des demi-points (X → X+)
-- ---------------------------------------------------------------------------

ALTER TABLE public.cecrl_scale
  ADD COLUMN IF NOT EXISTS base_label text;

UPDATE public.cecrl_scale
SET base_label = regexp_replace(cecrl_label, '\+$', '')
WHERE base_label IS NULL OR base_label IS DISTINCT FROM regexp_replace(cecrl_label, '\+$', '');

ALTER TABLE public.cecrl_scale
  ALTER COLUMN base_label SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cecrl_scale_plus_matches_base_check'
  ) THEN
    ALTER TABLE public.cecrl_scale
      ADD CONSTRAINT cecrl_scale_plus_matches_base_check
      CHECK (
        (score = trunc(score) AND cecrl_label = base_label)
        OR (
          score <> trunc(score)
          AND cecrl_label = base_label || '+'
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Notes : |général − calculé| ≤ 1 toujours ; note dès que l'écart ≠ 0
-- ---------------------------------------------------------------------------

ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_score_adjust_check;
ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_note_methodo_check;

ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_score_adjust_check
  CHECK (abs(score_general - score_general_calcule) <= 1);

ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_note_methodo_check
  CHECK (
    abs(score_general - score_general_calcule) = 0
    OR (
      note_methodologique IS NOT NULL
      AND length(btrim(note_methodologique)) > 0
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Vue : statut d'évaluation pour la liste formateur
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
  tb.sponsor_id,
  te.status AS evaluation_status
FROM public.test_bookings tb
LEFT JOIN public.test_candidates tc ON tb.candidate_id = tc.id
LEFT JOIN public.ski_schools ss ON tc.ski_school_id = ss.id
LEFT JOIN public.instructors i ON tb.instructor_id = i.id
LEFT JOIN public.test_evaluations te ON tb.id = te.booking_id;

ALTER VIEW public.test_bookings_complete SET (security_invoker = true);
GRANT SELECT ON public.test_bookings_complete TO authenticated;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'c3_dsf_partner_scores',
  'test_bookings',
  jsonb_build_object(
    'migration', '20260911130000_c3_dsf_partner_scores',
    'point', 'C.3',
    'fk', 'test_bookings.sponsor_id → partners.id',
    'score_adjust', 'abs(general-calcule)<=1 always; note if delta<>0'
  )
);

-- Kit de phrases ZZTEST (vouvoiement) pour la saisie C.3 — banque métier encore vide.
INSERT INTO public.test_phrases (
  language, category, profession, level_min, level_max, code, text_fr, is_positive, order_index, active
)
SELECT * FROM (VALUES
  ('all', 'introduction', NULL, 'A1', 'C2', 'ZZTEST-INT-01',
   'Vous vous présentez clairement et vous situez votre activité.', true, 1, true),
  ('all', 'introduction', NULL, 'A1', 'C2', 'ZZTEST-INT-02',
   'Vous avez du mal à introduire l''échange et à vous faire comprendre d''emblée.', false, 2, true),
  ('all', 'comprehension', NULL, 'A1', 'C2', 'ZZTEST-COMP-01',
   'Vous comprenez les consignes de sécurité et les questions de votre interlocuteur.', true, 1, true),
  ('all', 'comprehension', NULL, 'A1', 'C2', 'ZZTEST-COMP-02',
   'Vous avez besoin de répétitions pour suivre une consigne simple.', false, 2, true),
  ('all', 'technique', NULL, 'A1', 'C2', 'ZZTEST-TECH-01',
   'Votre vocabulaire technique est adapté aux situations de piste.', true, 1, true),
  ('all', 'technique', NULL, 'A1', 'C2', 'ZZTEST-TECH-02',
   'Votre lexique technique reste insuffisant pour décrire un incident.', false, 2, true),
  ('all', 'conclusion', NULL, 'A1', 'C2', 'ZZTEST-CONCL-01',
   'Vous pouvez conclure un échange professionnel de façon courtoise.', true, 1, true),
  ('all', 'conclusion', NULL, 'A1', 'C2', 'ZZTEST-CONCL-02',
   'Tu dois encore travailler ta conclusion.', false, 3, true)
) AS v(language, category, profession, level_min, level_max, code, text_fr, is_positive, order_index, active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.test_phrases p WHERE p.code = v.code
);

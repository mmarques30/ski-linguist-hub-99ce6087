-- Certificat de fin de formation : bilan Entrée / Sortie (remplace le niveau unique / mapping piste)

-- Colonnes formateur texte (si absentes — point 3)
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS formateur text,
  ADD COLUMN IF NOT EXISTS formateur_email text,
  ADD COLUMN IF NOT EXISTS formateur_telephone text;

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS niveau_general_entree text,
  ADD COLUMN IF NOT EXISTS niveau_technique_entree text,
  ADD COLUMN IF NOT EXISTS remarques_entree text,
  ADD COLUMN IF NOT EXISTS niveau_general_sortie text,
  ADD COLUMN IF NOT EXISTS niveau_technique_sortie text,
  ADD COLUMN IF NOT EXISTS objectif_atteint text,
  ADD COLUMN IF NOT EXISTS commentaire_sortie text,
  ADD COLUMN IF NOT EXISTS hours_followed numeric,
  ADD COLUMN IF NOT EXISTS entry_form_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS exit_form_completed_at timestamptz;

ALTER TABLE public.inscriptions
  DROP CONSTRAINT IF EXISTS inscriptions_objectif_atteint_check;

ALTER TABLE public.inscriptions
  ADD CONSTRAINT inscriptions_objectif_atteint_check
  CHECK (
    objectif_atteint IS NULL
    OR objectif_atteint IN ('oui', 'partiellement', 'non')
  );

-- Backfill depuis les colonnes historiques (entry_level / exit_level / finals)
UPDATE public.inscriptions SET
  niveau_general_entree = COALESCE(niveau_general_entree, entry_level),
  niveau_general_sortie = COALESCE(
    niveau_general_sortie,
    exit_level,
    final_general_level
  ),
  niveau_technique_sortie = COALESCE(
    niveau_technique_sortie,
    final_specific_level
  )
WHERE
  niveau_general_entree IS NULL
  OR niveau_general_sortie IS NULL
  OR niveau_technique_sortie IS NULL;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS hours_followed numeric,
  ADD COLUMN IF NOT EXISTS hours_planned numeric,
  ADD COLUMN IF NOT EXISTS progression_snapshot jsonb;

COMMENT ON COLUMN public.inscriptions.niveau_general_entree IS
  'Bilan entrée — niveau général (piste placement ou constat formateur 1er cours)';
COMMENT ON COLUMN public.inscriptions.niveau_technique_entree IS
  'Bilan entrée — niveau technique / métier (observation formateur)';
COMMENT ON COLUMN public.inscriptions.niveau_general_sortie IS
  'Bilan sortie — CECRL déclaré par le formateur·rice';
COMMENT ON COLUMN public.inscriptions.niveau_technique_sortie IS
  'Bilan sortie — CECRL technique déclaré par le formateur·rice';
COMMENT ON COLUMN public.inscriptions.objectif_atteint IS
  'oui | partiellement | non';
COMMENT ON COLUMN public.inscriptions.entry_level IS
  'DEPRECATED — synchronisé depuis niveau_general_entree pour compatibilité';
COMMENT ON COLUMN public.inscriptions.exit_level IS
  'DEPRECATED — synchronisé depuis niveau_general_sortie pour compatibilité';

-- Qualiopi PROC-026 : mesure de progression (seed si absent)
INSERT INTO public.qualiopi_indicators (
  criterion_number,
  indicator_number,
  label,
  unit,
  evidence_type,
  evidence_description,
  status
)
SELECT
  6,
  'PROC-026',
  'Mesure de la progression pédagogique (bilan Entrée / Sortie)',
  '%',
  'automatique',
  'Taux d’inscriptions terminées avec formulaire de sortie complet (niveaux général/technique + objectif + commentaire) alimentant le certificat de fin de formation.',
  'en_cours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.qualiopi_indicators WHERE indicator_number = 'PROC-026'
);

-- Exposer le bilan sur la vue inscriptions_complete
DROP VIEW IF EXISTS public.inscriptions_complete;
CREATE VIEW public.inscriptions_complete AS
SELECT
  i.id,
  i.created_at,
  i.updated_at,
  i.student_id,
  i.instructor_id,
  i.ski_school_id,
  i.modality,
  i.course_type,
  i.max_participants,
  i.language,
  i.certification_type,
  i.course_location,
  i.course_address,
  i.start_date,
  i.end_date,
  i.duration_hours,
  i.duration_days,
  i.hours_per_day,
  i.schedule,
  i.rhythm,
  i.entry_test_score,
  i.entry_level,
  i.exit_level,
  i.group_name,
  i.final_general_level,
  i.final_specific_level,
  i.certification_date,
  i.certification_result,
  i.pedagogical_cost,
  i.price,
  i.payment_method,
  i.deposit_amount,
  i.deposit_date,
  i.check_number,
  i.check_date,
  i.balance_after_deposit,
  i.status,
  i.final_status,
  i.qualiopi_status,
  i.expectations,
  i.observations,
  i.course_materials,
  i.code,
  i.status_changed_at,
  i.status_changed_by,
  i.niveau_general_entree,
  i.niveau_technique_entree,
  i.remarques_entree,
  i.niveau_general_sortie,
  i.niveau_technique_sortie,
  i.objectif_atteint,
  i.commentaire_sortie,
  i.hours_followed,
  i.entry_form_completed_at,
  i.exit_form_completed_at,
  i.formateur,
  i.formateur_email,
  i.formateur_telephone,
  i.entry_test_id,
  i.end_pack_sent_at,
  i.progression,
  (s.first_name || ' ' || s.last_name) AS student_name,
  s.email AS student_email,
  s.phone AS student_phone,
  s.city AS student_city,
  s.company AS student_company,
  (ins.first_name || ' ' || ins.last_name) AS instructor_name,
  ins.email AS instructor_email,
  ins.phone AS instructor_phone,
  sk.name AS ski_school_name,
  sk.director_name AS ski_school_director,
  sk.director_phone AS ski_school_director_phone
FROM inscriptions i
  LEFT JOIN students s ON i.student_id = s.id
  LEFT JOIN instructors ins ON i.instructor_id = ins.id
  LEFT JOIN ski_schools sk ON i.ski_school_id = sk.id;

-- Formulaires formateur début / fin : détail aligné Google Forms (JSONB)
-- Les colonnes certificat (niveau_* / objectif / commentaire) restent la synthèse.

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS formulaire_entree jsonb,
  ADD COLUMN IF NOT EXISTS formulaire_sortie jsonb;

COMMENT ON COLUMN public.inscriptions.formulaire_entree IS
  'Formulaire formateur début de formation (compétences CECRL, attentes, moyens) — JSON versionné';
COMMENT ON COLUMN public.inscriptions.formulaire_sortie IS
  'Formulaire formateur fin de formation (niveaux, objectif, commentaires) — JSON versionné';

-- Exposer sur la vue inscriptions_complete (recréer avec security_invoker)
DROP VIEW IF EXISTS public.inscriptions_complete;
CREATE VIEW public.inscriptions_complete
WITH (security_invoker = true)
AS
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
  i.formulaire_entree,
  i.formulaire_sortie,
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

GRANT SELECT ON public.inscriptions_complete TO authenticated, anon, service_role;

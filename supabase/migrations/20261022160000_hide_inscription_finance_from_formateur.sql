-- Masquer les montants / infos de paiement aux formateurs (et aux SELECT
-- directs non staff). Le staff lit via inscriptions_complete (security definer)
-- ou la vue inscription_finance.
-- Historique pédagogique (placement_tests) inchangé.

-- Colonnes commerciales sur public.inscriptions
-- price, payment_method, deposit_*, check_*, balance_after_deposit,
-- pedagogical_cost, funding_*

DO $$
DECLARE
  finance text[] := ARRAY[
    'price',
    'payment_method',
    'deposit_amount',
    'deposit_date',
    'check_number',
    'check_date',
    'balance_after_deposit',
    'pedagogical_cost',
    'funding_organization',
    'funding_details'
  ];
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'inscriptions'
    AND column_name <> ALL (finance);

  IF cols IS NULL OR cols = '' THEN
    RAISE EXCEPTION 'hide finance: aucune colonne non-financière trouvée';
  END IF;

  REVOKE SELECT ON public.inscriptions FROM authenticated;
  REVOKE SELECT ON public.inscriptions FROM anon;

  EXECUTE format(
    'GRANT SELECT (%s) ON public.inscriptions TO authenticated',
    cols
  );
  EXECUTE format(
    'GRANT SELECT (%s) ON public.inscriptions TO anon',
    cols
  );
END $$;

-- Vue finance staff-only (security definer = owner lit les colonnes révoquées)
DROP VIEW IF EXISTS public.inscription_finance;
CREATE VIEW public.inscription_finance
WITH (security_barrier = true)
AS
SELECT
  i.id,
  i.price,
  i.payment_method,
  i.deposit_amount,
  i.deposit_date,
  i.check_number,
  i.check_date,
  i.balance_after_deposit,
  i.pedagogical_cost,
  i.funding_organization,
  i.funding_details
FROM public.inscriptions i
WHERE public.is_staff();

COMMENT ON VIEW public.inscription_finance IS
  'Montants inscription — lecture staff uniquement (formateur exclu).';

GRANT SELECT ON public.inscription_finance TO authenticated;
GRANT SELECT ON public.inscription_finance TO service_role;

-- inscriptions_complete : definer + filtre de périmètre + montants staff-only
DROP VIEW IF EXISTS public.inscriptions_complete;
CREATE VIEW public.inscriptions_complete
WITH (security_barrier = true)
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
  CASE WHEN public.is_staff() THEN i.pedagogical_cost ELSE NULL END AS pedagogical_cost,
  CASE WHEN public.is_staff() THEN i.price ELSE NULL END AS price,
  CASE WHEN public.is_staff() THEN i.payment_method ELSE NULL END AS payment_method,
  CASE WHEN public.is_staff() THEN i.deposit_amount ELSE NULL END AS deposit_amount,
  CASE WHEN public.is_staff() THEN i.deposit_date ELSE NULL END AS deposit_date,
  CASE WHEN public.is_staff() THEN i.check_number ELSE NULL END AS check_number,
  CASE WHEN public.is_staff() THEN i.check_date ELSE NULL END AS check_date,
  CASE WHEN public.is_staff() THEN i.balance_after_deposit ELSE NULL END AS balance_after_deposit,
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
FROM public.inscriptions i
  LEFT JOIN public.students s ON i.student_id = s.id
  LEFT JOIN public.instructors ins ON i.instructor_id = ins.id
  LEFT JOIN public.ski_schools sk ON i.ski_school_id = sk.id
WHERE
  public.is_staff()
  OR (
    public.is_formateur()
    AND i.instructor_id IS NOT NULL
    AND i.instructor_id = public.get_my_instructor_id()
  )
  OR (
    public.is_student()
    AND i.student_id = public.get_my_student_id()
  );

GRANT SELECT ON public.inscriptions_complete TO authenticated, anon, service_role;

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'hide_inscription_finance_from_formateur',
  'inscriptions',
  jsonb_build_object(
    'migration', '20261022160000_hide_inscription_finance_from_formateur',
    'column_grants', 'finance columns revoked from authenticated/anon SELECT',
    'views', jsonb_build_array('inscription_finance', 'inscriptions_complete')
  )
);

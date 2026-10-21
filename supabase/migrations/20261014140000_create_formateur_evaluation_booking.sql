-- Formateur / staff : créer une réservation « test réalisé » pour saisir l'évaluation.
-- Pas d'INSERT RLS large sur test_bookings — SECURITY DEFINER borné.

ALTER TABLE public.test_bookings
  DROP CONSTRAINT IF EXISTS test_bookings_source_check;

ALTER TABLE public.test_bookings
  ADD CONSTRAINT test_bookings_source_check
  CHECK (source = ANY (ARRAY[
    'online_form'::text,
    'esf_import'::text,
    'dsf_import'::text,
    'manual'::text,
    'import_mollard_oct_2026'::text,
    'formateur_ui'::text
  ]));

CREATE OR REPLACE FUNCTION public.create_formateur_evaluation_booking(
  p_name text,
  p_email text,
  p_phone text,
  p_profession text,
  p_profession_autre text,
  p_ski_school_id uuid,
  p_carte_syndicale text,
  p_ski_discipline text,
  p_training_cycle text,
  p_language text,
  p_datetime timestamptz,
  p_sponsor_type text,
  p_payment_type text DEFAULT 'pending',
  p_instructor_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_instructor_id uuid;
  v_candidate_id uuid;
  v_booking_id uuid;
  v_profession text;
  v_discipline text;
  v_cycle text;
  v_language text;
  v_sponsor text;
  v_payment text;
  v_sponsor_id uuid;
BEGIN
  IF NOT (public.is_formateur() OR public.is_staff()) THEN
    RAISE EXCEPTION 'Réservé au formateur ou au staff'
      USING ERRCODE = '42501';
  END IF;

  IF public.is_staff() AND p_instructor_id IS NOT NULL THEN
    v_instructor_id := p_instructor_id;
  ELSIF public.is_formateur() THEN
    v_instructor_id := public.get_my_instructor_id();
  ELSE
    v_instructor_id := p_instructor_id;
  END IF;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Formateur obligatoire'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.instructors i WHERE i.id = v_instructor_id
  ) THEN
    RAISE EXCEPTION 'Formateur inconnu'
      USING ERRCODE = '23514';
  END IF;

  v_profession := nullif(btrim(coalesce(p_profession, '')), '');
  IF v_profession IS NULL OR v_profession NOT IN (
    'moniteur', 'pisteur', 'rm', 'caissier', 'controleur', 'autre'
  ) THEN
    RAISE EXCEPTION 'Profession invalide'
      USING ERRCODE = '23514';
  END IF;

  IF nullif(btrim(coalesce(p_name, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_email, '')), '') IS NULL
     OR nullif(btrim(coalesce(p_phone, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Nom, e-mail et téléphone sont obligatoires'
      USING ERRCODE = '23514';
  END IF;

  IF p_ski_school_id IS NULL THEN
    RAISE EXCEPTION 'École / entreprise obligatoire'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ski_schools s WHERE s.id = p_ski_school_id
  ) THEN
    RAISE EXCEPTION 'École de ski inconnue'
      USING ERRCODE = '23514';
  END IF;

  v_discipline := nullif(btrim(coalesce(p_ski_discipline, '')), '');
  v_cycle := nullif(btrim(coalesce(p_training_cycle, '')), '');
  IF v_profession = 'moniteur' THEN
    IF v_discipline IS NULL OR v_discipline NOT IN ('alpin', 'nordique') THEN
      RAISE EXCEPTION 'Discipline (alpin / nordique) obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
    IF v_cycle IS NULL THEN
      RAISE EXCEPTION 'Cycle de formation obligatoire pour un moniteur de ski'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    v_discipline := NULL;
    v_cycle := NULL;
  END IF;

  v_language := nullif(btrim(coalesce(p_language, '')), '');
  IF v_language IS NULL OR v_language NOT IN (
    'anglais', 'portugais', 'espagnol', 'neerlandais', 'russe',
    'italien', 'chinois', 'allemand', 'fle'
  ) THEN
    RAISE EXCEPTION 'Langue invalide'
      USING ERRCODE = '23514';
  END IF;

  IF p_datetime IS NULL THEN
    RAISE EXCEPTION 'Date du test obligatoire'
      USING ERRCODE = '23514';
  END IF;

  v_sponsor := nullif(btrim(coalesce(p_sponsor_type, '')), '');
  IF v_sponsor IS NULL OR v_sponsor NOT IN ('esf', 'ecole_ski', 'dsf') THEN
    RAISE EXCEPTION 'Type de commanditaire invalide'
      USING ERRCODE = '23514';
  END IF;

  v_payment := nullif(btrim(coalesce(p_payment_type, '')), '');
  IF v_payment IS NULL THEN
    v_payment := 'pending';
  END IF;
  IF v_payment NOT IN (
    'pending', 'stripe', 'bank_transfer', 'invoice', 'school_invoice'
  ) THEN
    RAISE EXCEPTION 'Type de paiement invalide'
      USING ERRCODE = '23514';
  END IF;

  -- sponsor_id → partners(id) uniquement (pas ski_schools).
  IF v_sponsor = 'dsf' THEN
    v_sponsor_id := public.dsf_partner_id();
  ELSE
    SELECT p.id
      INTO v_sponsor_id
      FROM public.partners p
      JOIN public.ski_schools s ON s.id = p_ski_school_id
     WHERE lower(btrim(p.name)) = lower(btrim(s.name))
     LIMIT 1;
  END IF;

  INSERT INTO public.test_candidates (
    name, email, phone, profession, profession_autre, ski_school_id,
    carte_syndicale, ski_discipline, training_cycle
  ) VALUES (
    btrim(p_name),
    btrim(p_email),
    btrim(p_phone),
    v_profession,
    CASE
      WHEN v_profession = 'autre'
      THEN nullif(btrim(coalesce(p_profession_autre, '')), '')
      ELSE NULL
    END,
    p_ski_school_id,
    nullif(btrim(coalesce(p_carte_syndicale, '')), ''),
    v_discipline,
    v_cycle
  )
  RETURNING id INTO v_candidate_id;

  INSERT INTO public.test_bookings (
    candidate_id,
    instructor_id,
    language,
    datetime,
    status,
    payment_type,
    previous_test,
    source,
    sponsor_type,
    sponsor_id
  ) VALUES (
    v_candidate_id,
    v_instructor_id,
    v_language,
    p_datetime,
    'completed',
    v_payment,
    false,
    'formateur_ui',
    v_sponsor,
    v_sponsor_id
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.audit_log (action, table_name, record_id, new_values)
  VALUES (
    'create_formateur_evaluation_booking',
    'test_bookings',
    v_booking_id,
    jsonb_build_object(
      'sponsor_type', v_sponsor,
      'language', v_language,
      'by_formateur', public.is_formateur(),
      'by_staff', public.is_staff()
    )
  );

  RETURN v_booking_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.create_formateur_evaluation_booking(
  text, text, text, text, text, uuid, text, text, text, text, timestamptz, text, text, uuid
) TO authenticated;

COMMENT ON FUNCTION public.create_formateur_evaluation_booking IS
  'Crée candidat + réservation completed pour saisie d''évaluation (formateur ou staff).';

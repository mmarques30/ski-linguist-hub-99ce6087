-- Hub /tests-oraux Phase A : créer une réservation planifiée depuis une demande
-- (test_candidates sans booking). Remplace le geste sheet → Make pour le suivi ops.
-- Status confirmed / pending_payment (pas completed — ce n'est pas une saisie rétro).

CREATE OR REPLACE FUNCTION public.create_test_booking_from_candidate(
  p_candidate_id uuid,
  p_language text,
  p_datetime timestamptz,
  p_instructor_id uuid,
  p_sponsor_type text,
  p_payment_type text DEFAULT 'pending',
  p_previous_test boolean DEFAULT false,
  p_previous_result text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_booking_id uuid;
  v_language text;
  v_sponsor text;
  v_payment text;
  v_status text;
  v_sponsor_id uuid;
  v_ski_school_id uuid;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Réservé au staff'
      USING ERRCODE = '42501';
  END IF;

  IF p_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Candidat obligatoire'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.test_candidates c WHERE c.id = p_candidate_id
  ) THEN
    RAISE EXCEPTION 'Candidat inconnu'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.test_bookings b
     WHERE b.candidate_id = p_candidate_id
       AND b.status IN ('pending_payment', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'Une réservation active existe déjà pour ce candidat'
      USING ERRCODE = '23514';
  END IF;

  IF p_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Formateur obligatoire'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.instructors i WHERE i.id = p_instructor_id AND i.is_active
  ) THEN
    RAISE EXCEPTION 'Formateur inconnu ou inactif'
      USING ERRCODE = '23514';
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

  IF v_payment = 'pending' THEN
    v_status := 'pending_payment';
  ELSE
    v_status := 'confirmed';
  END IF;

  SELECT c.ski_school_id INTO v_ski_school_id
    FROM public.test_candidates c
   WHERE c.id = p_candidate_id;

  IF v_sponsor = 'dsf' THEN
    v_sponsor_id := public.dsf_partner_id();
  ELSIF v_ski_school_id IS NOT NULL THEN
    SELECT p.id
      INTO v_sponsor_id
      FROM public.partners p
      JOIN public.ski_schools s ON s.id = v_ski_school_id
     WHERE lower(btrim(p.name)) = lower(btrim(s.name))
     LIMIT 1;
  ELSE
    v_sponsor_id := NULL;
  END IF;

  INSERT INTO public.test_bookings (
    candidate_id,
    instructor_id,
    language,
    datetime,
    status,
    payment_type,
    previous_test,
    previous_result,
    source,
    sponsor_type,
    sponsor_id
  ) VALUES (
    p_candidate_id,
    p_instructor_id,
    v_language,
    p_datetime,
    v_status,
    v_payment,
    coalesce(p_previous_test, false),
    nullif(btrim(coalesce(p_previous_result, '')), ''),
    'online_form',
    v_sponsor,
    v_sponsor_id
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.audit_log (action, table_name, record_id, new_values)
  VALUES (
    'create_test_booking_from_candidate',
    'test_bookings',
    v_booking_id,
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'sponsor_type', v_sponsor,
      'language', v_language,
      'status', v_status,
      'payment_type', v_payment
    )
  );

  RETURN v_booking_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.create_test_booking_from_candidate(
  uuid, text, timestamptz, uuid, text, text, boolean, text
) TO authenticated;

COMMENT ON FUNCTION public.create_test_booking_from_candidate IS
  'Staff : crée une réservation planifiée (pending_payment/confirmed) depuis une demande test_candidates.';

-- Notif admin après /reserver-test → hub Demandes (plus /tests placement).
CREATE OR REPLACE FUNCTION public.submit_test_booking_candidate(
  p_name text,
  p_email text,
  p_phone text,
  p_profession text,
  p_profession_autre text,
  p_ski_school_id uuid,
  p_carte_syndicale text,
  p_ski_discipline text,
  p_training_cycle text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_profession text;
  v_discipline text;
  v_cycle text;
BEGIN
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
    RAISE EXCEPTION 'École de ski obligatoire'
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

  INSERT INTO public.test_candidates (
    name,
    email,
    phone,
    profession,
    profession_autre,
    ski_school_id,
    carte_syndicale,
    ski_discipline,
    training_cycle
  ) VALUES (
    btrim(p_name),
    btrim(p_email),
    btrim(p_phone),
    v_profession,
    CASE WHEN v_profession = 'autre' THEN nullif(btrim(coalesce(p_profession_autre, '')), '') ELSE NULL END,
    p_ski_school_id,
    nullif(btrim(coalesce(p_carte_syndicale, '')), ''),
    v_discipline,
    v_cycle
  )
  RETURNING id INTO v_id;

  PERFORM public.notify_admins(
    'test',
    'Nouvelle demande de test oral',
    btrim(p_name) || ' · ' || btrim(p_email),
    '/tests-oraux?tab=demandes'
  );

  RETURN v_id;
END;
$function$;

-- C.6 ZZTEST visibility proof (one-shot, not a migration).
-- Convention ZZTEST + @example.invalid. Aucune identité réelle.
-- Crée, contrôle (SET ROLE authenticated + jwt sub), journalise, supprime.

DELETE FROM public.test_evaluations
WHERE booking_id IN (
  SELECT b.id FROM public.test_bookings b
  JOIN public.test_candidates c ON c.id = b.candidate_id
  WHERE c.email ILIKE 'zztest.c6.%@example.invalid'
);
DELETE FROM public.test_bookings
WHERE candidate_id IN (
  SELECT id FROM public.test_candidates WHERE email ILIKE 'zztest.c6.%@example.invalid'
);
DELETE FROM public.test_candidates WHERE email ILIKE 'zztest.c6.%@example.invalid';
DELETE FROM public.students WHERE email ILIKE 'zztest.c6.%@example.invalid';
DELETE FROM public.instructors WHERE email ILIKE 'zztest.c6.%@example.invalid';
DELETE FROM public.ski_schools WHERE name = 'ZZTEST C6 School';
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.c6.%@example.invalid');
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.c6.%@example.invalid');
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.c6.%@example.invalid');
DELETE FROM auth.users WHERE email ILIKE 'zztest.c6.%@example.invalid';

CREATE OR REPLACE FUNCTION public._c6_make_auth_user(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public', 'extensions'
AS $fn$
DECLARE
  uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token,
    created_at, updated_at
  ) VALUES (
    uid, '00000000-0000-0000-0000-000000000000', _email,
    crypt('zztest-c6-not-used', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated', 'authenticated',
    '', '', '', '', '', '', '', '',
    now(), now()
  );
  INSERT INTO auth.identities (
    user_id, identity_data, provider, provider_id, created_at, updated_at
  ) VALUES (
    uid,
    jsonb_build_object('sub', uid::text, 'email', _email),
    'email',
    uid::text,
    now(),
    now()
  );
  RETURN uid;
END;
$fn$;

DO $proof$
DECLARE
  uid_a uuid;
  uid_b uuid;
  uid_f uuid;
  uid_g uuid;
  uid_s uuid;
  school_id uuid;
  instr_f uuid;
  instr_g uuid;
  stu_a uuid;
  stu_b uuid;
  cand_a uuid;
  cand_b uuid;
  book_a_esf uuid;
  book_a_dsf uuid;
  book_b_esf uuid;
  dsf_id uuid := public.dsf_partner_id();
  n_eval int;
  n_book int;
  n_complete int;
  n_dsf int;
  n_company text;
  n_station text;
  n_scores int;
  proof jsonb := '[]'::jsonb;
BEGIN
  IF dsf_id IS NULL THEN
    RAISE EXCEPTION 'Partenaire DSF manquant';
  END IF;

  uid_a := public._c6_make_auth_user('zztest.c6.a@example.invalid');
  uid_b := public._c6_make_auth_user('zztest.c6.b@example.invalid');
  uid_f := public._c6_make_auth_user('zztest.c6.form@example.invalid');
  uid_g := public._c6_make_auth_user('zztest.c6.form2@example.invalid');
  uid_s := public._c6_make_auth_user('zztest.c6.staff@example.invalid');

  INSERT INTO public.user_roles (user_id, role) VALUES
    (uid_a, 'student'),
    (uid_b, 'student'),
    (uid_f, 'formateur'),
    (uid_g, 'formateur'),
    (uid_s, 'user');

  INSERT INTO public.ski_schools (name, station, school_kind)
  VALUES ('ZZTEST C6 School', 'ZZTEST C6 Station', 'esf')
  RETURNING id INTO school_id;

  INSERT INTO public.instructors (first_name, last_name, email, auth_user_id, is_active, status)
  VALUES
    ('ZZTEST', 'C6Formateur', 'zztest.c6.form@example.invalid', uid_f, true, 'actif')
  RETURNING id INTO instr_f;

  INSERT INTO public.instructors (first_name, last_name, email, auth_user_id, is_active, status)
  VALUES
    ('ZZTEST', 'C6FormateurB', 'zztest.c6.form2@example.invalid', uid_g, true, 'actif')
  RETURNING id INTO instr_g;

  INSERT INTO public.students (first_name, last_name, email, auth_user_id)
  VALUES ('ZZTEST', 'C6A', 'zztest.c6.a@example.invalid', uid_a)
  RETURNING id INTO stu_a;

  INSERT INTO public.students (first_name, last_name, email, auth_user_id)
  VALUES ('ZZTEST', 'C6B', 'zztest.c6.b@example.invalid', uid_b)
  RETURNING id INTO stu_b;

  INSERT INTO public.test_candidates (name, email, phone, profession, ski_school_id, student_id, ski_discipline, training_cycle)
  VALUES ('ZZTEST C6A', 'zztest.c6.a@example.invalid', '0600000000', 'moniteur', school_id, stu_a, 'alpin', '1')
  RETURNING id INTO cand_a;

  INSERT INTO public.test_candidates (name, email, phone, profession, ski_school_id, student_id, ski_discipline, training_cycle)
  VALUES ('ZZTEST C6B', 'zztest.c6.b@example.invalid', '0600000001', 'moniteur', school_id, stu_b, 'alpin', '1')
  RETURNING id INTO cand_b;

  INSERT INTO public.test_bookings (
    candidate_id, instructor_id, language, datetime, payment_type, source,
    sponsor_type, sponsor_id, status
  ) VALUES (
    cand_a, instr_f, 'anglais', '2026-02-10 09:00:00+00', 'school_invoice', 'manual',
    'esf', NULL, 'completed'
  ) RETURNING id INTO book_a_esf;

  INSERT INTO public.test_bookings (
    candidate_id, instructor_id, language, datetime, payment_type, source,
    sponsor_type, sponsor_id, status
  ) VALUES (
    cand_a, instr_f, 'anglais', '2026-02-11 09:00:00+00', 'school_invoice', 'manual',
    'dsf', dsf_id, 'completed'
  ) RETURNING id INTO book_a_dsf;

  INSERT INTO public.test_bookings (
    candidate_id, instructor_id, language, datetime, payment_type, source,
    sponsor_type, sponsor_id, status
  ) VALUES (
    cand_b, instr_g, 'allemand', '2026-02-12 09:00:00+00', 'school_invoice', 'manual',
    'esf', NULL, 'completed'
  ) RETURNING id INTO book_b_esf;

  INSERT INTO public.test_evaluations (
    booking_id, score_comprehension, score_expression, score_structure,
    score_technique, score_conversation, score_general, scoring_system, status
  ) VALUES
    (book_a_esf, 3, 3, 3, 3, 3, 3, 'sur_5', 'brouillon'),
    (book_a_dsf, 2, 2, 2, 2, 2, 2, 'sur_5', 'brouillon'),
    (book_b_esf, 4, 4, 4, 4, 4, 4, 'sur_5', 'brouillon');

  -- Candidat A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n_eval FROM public.test_evaluations;
  SELECT count(*) INTO n_book FROM public.test_bookings;
  SELECT count(*) INTO n_complete FROM public.test_bookings_complete;
  SELECT count(*) INTO n_dsf FROM public.test_bookings WHERE sponsor_type = 'dsf';
  proof := proof || jsonb_build_array(jsonb_build_object(
    'actor', 'candidat_a', 'evaluations', n_eval, 'bookings', n_book,
    'complete', n_complete, 'dsf_bookings', n_dsf,
    'expect_eval', 1, 'expect_book', 1, 'expect_dsf', 0
  ));
  EXECUTE 'RESET ROLE';

  -- Formateur F (propriétaire de A)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_f, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n_eval FROM public.test_evaluations;
  SELECT count(*) INTO n_book FROM public.test_bookings;
  SELECT count(*) INTO n_dsf FROM public.test_bookings WHERE sponsor_type = 'dsf';
  SELECT count(*) INTO n_complete FROM public.test_bookings_complete;
  proof := proof || jsonb_build_array(jsonb_build_object(
    'actor', 'formateur_f', 'evaluations', n_eval, 'bookings', n_book,
    'complete', n_complete, 'dsf_bookings', n_dsf,
    'expect_eval', 2, 'expect_book', 2, 'expect_dsf', 1
  ));
  EXECUTE 'RESET ROLE';

  -- Formateur G (B seulement)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_g, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n_eval FROM public.test_evaluations;
  SELECT count(*) INTO n_book FROM public.test_bookings;
  SELECT count(*) INTO n_dsf FROM public.test_bookings WHERE sponsor_type = 'dsf';
  proof := proof || jsonb_build_array(jsonb_build_object(
    'actor', 'formateur_g', 'evaluations', n_eval, 'bookings', n_book,
    'dsf_bookings', n_dsf,
    'expect_eval', 1, 'expect_book', 1, 'expect_dsf', 0
  ));
  EXECUTE 'RESET ROLE';

  -- Staff
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_s, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n_eval FROM public.test_evaluations;
  SELECT count(*) INTO n_book FROM public.test_bookings;
  SELECT count(*) INTO n_dsf FROM public.test_bookings WHERE sponsor_type = 'dsf';
  SELECT count(*) INTO n_complete FROM public.test_bookings_complete;
  SELECT company_name, station INTO n_company, n_station
    FROM public.test_bookings_complete WHERE id = book_a_dsf;
  SELECT count(*) INTO n_scores
    FROM public.test_bookings_complete
    WHERE id = book_a_dsf
      AND score_comprehension IS NOT NULL
      AND score_expression IS NOT NULL
      AND score_structure IS NOT NULL
      AND score_technique IS NOT NULL
      AND score_conversation IS NOT NULL
      AND cecrl_label IS NOT NULL;
  proof := proof || jsonb_build_array(jsonb_build_object(
    'actor', 'staff', 'evaluations', n_eval, 'bookings', n_book,
    'complete', n_complete, 'dsf_bookings', n_dsf,
    'dsf_company_is_partner', (n_company IS NOT NULL AND n_company <> ''),
    'dsf_station_present', (n_station = 'ZZTEST C6 Station'),
    'dsf_five_scores', n_scores,
    'expect_eval', 3, 'expect_book', 3, 'expect_dsf', 1
  ));
  EXECUTE 'RESET ROLE';

  -- Nettoyage (pas de PII dans le journal)
  DELETE FROM public.test_evaluations WHERE booking_id IN (book_a_esf, book_a_dsf, book_b_esf);
  DELETE FROM public.test_bookings WHERE id IN (book_a_esf, book_a_dsf, book_b_esf);
  DELETE FROM public.test_candidates WHERE id IN (cand_a, cand_b);
  DELETE FROM public.students WHERE id IN (stu_a, stu_b);
  DELETE FROM public.instructors WHERE id IN (instr_f, instr_g);
  DELETE FROM public.ski_schools WHERE id = school_id;
  DELETE FROM public.user_roles WHERE user_id IN (uid_a, uid_b, uid_f, uid_g, uid_s);
  DELETE FROM public.profiles WHERE id IN (uid_a, uid_b, uid_f, uid_g, uid_s);
  DELETE FROM auth.identities WHERE user_id IN (uid_a, uid_b, uid_f, uid_g, uid_s);
  DELETE FROM auth.users WHERE id IN (uid_a, uid_b, uid_f, uid_g, uid_s);

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES (
    'c6_zztest_proof',
    'test_evaluations',
    jsonb_build_object(
      'point', 'C.6',
      'convention', 'ZZTEST @example.invalid',
      'cleaned', true,
      'results', proof
    )
  );
END;
$proof$;

DROP FUNCTION public._c6_make_auth_user(text);

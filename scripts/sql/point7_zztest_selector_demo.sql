-- Point 7 — jeu ZZTEST pour la démonstration du sélecteur de phrases (one-shot).
-- Convention ZZTEST + @example.invalid. Aucune identité réelle.
-- Crée un formateur avec mot de passe, un candidat et un test à évaluer.
-- À supprimer ensuite : voir point7_zztest_selector_demo_cleanup.sql.

DELETE FROM public.test_evaluations
WHERE booking_id IN (
  SELECT b.id FROM public.test_bookings b
  JOIN public.test_candidates c ON c.id = b.candidate_id
  WHERE c.email ILIKE 'zztest.p7.%@example.invalid'
);
DELETE FROM public.test_bookings
WHERE candidate_id IN (
  SELECT id FROM public.test_candidates WHERE email ILIKE 'zztest.p7.%@example.invalid'
);
DELETE FROM public.test_candidates WHERE email ILIKE 'zztest.p7.%@example.invalid';
DELETE FROM public.students WHERE email ILIKE 'zztest.p7.%@example.invalid';
DELETE FROM public.instructors WHERE email ILIKE 'zztest.p7.%@example.invalid';
DELETE FROM public.ski_schools WHERE name = 'ZZTEST P7 School';
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid');
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid');
DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid');
DELETE FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid';

-- Les colonnes de jetons doivent être des chaînes vides, pas NULL,
-- sinon la connexion échoue avec « Database error querying schema ».
CREATE OR REPLACE FUNCTION public._p7_make_auth_user(_email text, _password text)
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
    crypt(_password, gen_salt('bf')),
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

DO $demo$
DECLARE
  uid_f uuid;
  uid_c uuid;
  school_id uuid;
  instr_f uuid;
  stu_c uuid;
  cand_c uuid;
  book_c uuid;
BEGIN
  uid_f := public._p7_make_auth_user('zztest.p7.form@example.invalid', 'ZZTESTp7-demo!');
  uid_c := public._p7_make_auth_user('zztest.p7.cand@example.invalid', 'ZZTESTp7-demo!');

  INSERT INTO public.user_roles (user_id, role) VALUES
    (uid_f, 'formateur'),
    (uid_c, 'student');

  INSERT INTO public.ski_schools (name, station, school_kind)
  VALUES ('ZZTEST P7 School', 'ZZTEST P7 Station', 'esf')
  RETURNING id INTO school_id;

  INSERT INTO public.instructors (first_name, last_name, email, auth_user_id, is_active, status)
  VALUES ('ZZTEST', 'P7Formateur', 'zztest.p7.form@example.invalid', uid_f, true, 'actif')
  RETURNING id INTO instr_f;

  INSERT INTO public.students (first_name, last_name, email, auth_user_id)
  VALUES ('ZZTEST', 'P7Candidat', 'zztest.p7.cand@example.invalid', uid_c)
  RETURNING id INTO stu_c;

  INSERT INTO public.test_candidates
    (name, email, phone, profession, ski_school_id, student_id, ski_discipline, training_cycle)
  VALUES
    ('ZZTEST P7Candidat', 'zztest.p7.cand@example.invalid', '0600000007', 'moniteur',
     school_id, stu_c, 'alpin', '1')
  RETURNING id INTO cand_c;

  INSERT INTO public.test_bookings (
    candidate_id, instructor_id, language, datetime, payment_type, source,
    sponsor_type, sponsor_id, status
  ) VALUES (
    cand_c, instr_f, 'portugais', now() + interval '1 day', 'school_invoice', 'manual',
    'esf', NULL, 'confirmed'
  ) RETURNING id INTO book_c;

  RAISE NOTICE 'formateur=% booking=%', uid_f, book_c;
END;
$demo$;

DROP FUNCTION IF EXISTS public._p7_make_auth_user(text, text);

SELECT
  b.id AS booking_id,
  b.language,
  c.name AS candidate,
  i.email AS formateur_email
FROM public.test_bookings b
JOIN public.test_candidates c ON c.id = b.candidate_id
JOIN public.instructors i ON i.id = b.instructor_id
WHERE c.email ILIKE 'zztest.p7.%@example.invalid';

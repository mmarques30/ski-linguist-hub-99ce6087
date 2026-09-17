-- Comptes ZZTEST formateur + stagiaire pour tester les vues.
-- Emails @example.invalid, mots de passe documentés dans
-- src/lib/zztest-roles-logins.ts et /admin/testing.
-- Idempotent : recrée les deux comptes et un jeu minimal (booking + inscription).

CREATE OR REPLACE FUNCTION public._zztest_make_auth_user(_email text, _password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public', 'extensions'
AS $fn$
DECLARE
  uid uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = _email) THEN
    SELECT id INTO uid FROM auth.users WHERE email = _email;
    UPDATE auth.users SET
      encrypted_password = crypt(_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      recovery_token = '',
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      updated_at = now()
    WHERE id = uid;
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = uid AND provider = 'email') THEN
      INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, created_at, updated_at)
      VALUES (uid, jsonb_build_object('sub', uid::text, 'email', _email), 'email', uid::text, now(), now());
    END IF;
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (uid, _email, split_part(_email, '@', 1))
    ON CONFLICT (id) DO NOTHING;
    RETURN uid;
  END IF;

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

  INSERT INTO auth.identities (user_id, identity_data, provider, provider_id, created_at, updated_at)
  VALUES (uid, jsonb_build_object('sub', uid::text, 'email', _email), 'email', uid::text, now(), now());

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (uid, _email, split_part(_email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  RETURN uid;
END;
$fn$;

DO $demo$
DECLARE
  uid_f uuid;
  uid_s uuid;
  school_id uuid;
  instr_id uuid;
  stu_id uuid;
  cand_id uuid;
  book_id uuid;
BEGIN
  DELETE FROM public.test_evaluations
  WHERE booking_id IN (
    SELECT b.id FROM public.test_bookings b
    WHERE b.instructor_id IN (SELECT id FROM public.instructors WHERE email = 'zztest.formateur@example.invalid')
       OR b.candidate_id IN (SELECT id FROM public.test_candidates WHERE email = 'zztest.stagiaire@example.invalid')
  );
  DELETE FROM public.test_bookings
  WHERE instructor_id IN (SELECT id FROM public.instructors WHERE email = 'zztest.formateur@example.invalid')
     OR candidate_id IN (SELECT id FROM public.test_candidates WHERE email = 'zztest.stagiaire@example.invalid');
  DELETE FROM public.test_candidates WHERE email = 'zztest.stagiaire@example.invalid';
  DELETE FROM public.document_sendings WHERE inscription_id IN (
    SELECT id FROM public.inscriptions WHERE student_id IN (
      SELECT id FROM public.students WHERE email = 'zztest.stagiaire@example.invalid'
    )
  );
  DELETE FROM public.inscriptions WHERE student_id IN (
    SELECT id FROM public.students WHERE email = 'zztest.stagiaire@example.invalid'
  );
  DELETE FROM public.students WHERE email = 'zztest.stagiaire@example.invalid';
  DELETE FROM public.instructors WHERE email = 'zztest.formateur@example.invalid';
  DELETE FROM public.ski_schools WHERE name = 'ZZTEST School Roles';
  DELETE FROM public.user_roles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('zztest.formateur@example.invalid','zztest.stagiaire@example.invalid')
  );
  DELETE FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email IN ('zztest.formateur@example.invalid','zztest.stagiaire@example.invalid')
  );
  DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('zztest.formateur@example.invalid','zztest.stagiaire@example.invalid')
  );
  DELETE FROM auth.users WHERE email IN ('zztest.formateur@example.invalid','zztest.stagiaire@example.invalid');

  uid_f := public._zztest_make_auth_user('zztest.formateur@example.invalid', 'ZZTEST-Formateur1!');
  uid_s := public._zztest_make_auth_user('zztest.stagiaire@example.invalid', 'ZZTEST-Stagiaire1!');

  INSERT INTO public.user_roles (user_id, role) VALUES
    (uid_f, 'formateur'),
    (uid_s, 'student')
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles SET full_name = 'ZZTEST Formateur' WHERE id = uid_f;
  UPDATE public.profiles SET full_name = 'ZZTEST Stagiaire' WHERE id = uid_s;

  INSERT INTO public.ski_schools (name, station, school_kind)
  VALUES ('ZZTEST School Roles', 'Val d''Isère', 'esf')
  RETURNING id INTO school_id;

  INSERT INTO public.instructors (first_name, last_name, email, auth_user_id, is_active, status)
  VALUES ('ZZTEST', 'Formateur', 'zztest.formateur@example.invalid', uid_f, true, 'actif')
  RETURNING id INTO instr_id;

  INSERT INTO public.students (first_name, last_name, email, auth_user_id)
  VALUES ('ZZTEST', 'Stagiaire', 'zztest.stagiaire@example.invalid', uid_s)
  RETURNING id INTO stu_id;

  INSERT INTO public.test_candidates
    (name, email, phone, profession, ski_school_id, student_id, ski_discipline, training_cycle)
  VALUES
    ('ZZTEST Candidat Roles', 'zztest.stagiaire@example.invalid', '0600000099', 'moniteur',
     school_id, stu_id, 'alpin', '1')
  RETURNING id INTO cand_id;

  INSERT INTO public.test_bookings (
    candidate_id, instructor_id, language, datetime, payment_type, source,
    sponsor_type, status
  ) VALUES (
    cand_id, instr_id, 'anglais', now() + interval '2 days', 'school_invoice', 'manual',
    'esf', 'confirmed'
  ) RETURNING id INTO book_id;

  INSERT INTO public.inscriptions (
    code, student_id, language, start_date, end_date, duration_hours,
    modality, course_location, status, price, funding_organization
  ) VALUES (
    'ZZTEST-ROLES-001', stu_id, 'Anglais',
    CURRENT_DATE + 14, CURRENT_DATE + 18, 20,
    'en_ligne_individuel', 'En ligne', 'confirmee', 890, 'Autofinancement'
  );
END;
$demo$;

DROP FUNCTION IF EXISTS public._zztest_make_auth_user(text, text);

SELECT u.email, ur.role::text AS role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('zztest.formateur@example.invalid','zztest.stagiaire@example.invalid')
ORDER BY ur.role;

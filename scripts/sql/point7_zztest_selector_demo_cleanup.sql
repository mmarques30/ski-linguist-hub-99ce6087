-- Point 7 — suppression du jeu ZZTEST de démonstration du sélecteur (one-shot).
-- À exécuter juste après la démonstration. Journalise les compteurs avant / après.

DO $cleanup$
DECLARE
  n_students int; n_instructors int; n_candidates int; n_bookings int;
  n_evaluations int; n_schools int; n_auth int; n_phrases int;
  journal jsonb;
BEGIN
  SELECT count(*) INTO n_students FROM public.students WHERE email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_instructors FROM public.instructors WHERE email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_candidates FROM public.test_candidates WHERE email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_bookings FROM public.test_bookings b
    JOIN public.test_candidates c ON c.id = b.candidate_id
    WHERE c.email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_evaluations FROM public.test_evaluations e
    JOIN public.test_bookings b ON b.id = e.booking_id
    JOIN public.test_candidates c ON c.id = b.candidate_id
    WHERE c.email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_schools FROM public.ski_schools WHERE name = 'ZZTEST P7 School';
  SELECT count(*) INTO n_auth FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid';
  SELECT count(*) INTO n_phrases FROM public.test_phrases;

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

  journal := jsonb_build_object(
    'point', '7',
    'fixture', 'zztest.p7.*@example.invalid',
    'before', jsonb_build_object(
      'students', n_students, 'instructors', n_instructors, 'candidates', n_candidates,
      'bookings', n_bookings, 'evaluations', n_evaluations, 'ski_schools', n_schools,
      'auth_users', n_auth, 'test_phrases', n_phrases
    ),
    'after', jsonb_build_object(
      'students', (SELECT count(*) FROM public.students WHERE email ILIKE 'zztest.p7.%@example.invalid'),
      'instructors', (SELECT count(*) FROM public.instructors WHERE email ILIKE 'zztest.p7.%@example.invalid'),
      'candidates', (SELECT count(*) FROM public.test_candidates WHERE email ILIKE 'zztest.p7.%@example.invalid'),
      'bookings', 0,
      'evaluations', 0,
      'ski_schools', (SELECT count(*) FROM public.ski_schools WHERE name = 'ZZTEST P7 School'),
      'auth_users', (SELECT count(*) FROM auth.users WHERE email ILIKE 'zztest.p7.%@example.invalid'),
      'test_phrases', (SELECT count(*) FROM public.test_phrases)
    )
  );

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES ('cleanup_zztest_point7', 'test_bookings', journal);
END;
$cleanup$;

SELECT created_at, new_values
FROM public.audit_log
WHERE action = 'cleanup_zztest_point7'
ORDER BY created_at DESC
LIMIT 1;

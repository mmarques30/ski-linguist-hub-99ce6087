-- Point 10 — suppression du jeu ZZTEST de recette du cycle de vie (one-shot).
-- Cible uniquement zztest.p10.*@example.invalid et le compte admin temporaire.
-- Ne touche JAMAIS FLI-260006 / zztest.camille@example.invalid.

DO $cleanup$
DECLARE
  student_ids uuid[];
  inscription_ids uuid[];
  invoice_ids uuid[];
  payment_ids uuid[];
  certificate_ids uuid[];
  auth_ids uuid[];
  n_students int;
  n_inscriptions int;
  n_invoices int;
  n_certificates int;
  n_surveys int;
  n_auth int;
  n_storage int;
  journal jsonb;
BEGIN
  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO student_ids
    FROM public.students
   WHERE email ILIKE 'zztest.p10.%@example.invalid';

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO inscription_ids
    FROM public.inscriptions
   WHERE student_id = ANY (student_ids);

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO invoice_ids
    FROM public.invoices
   WHERE student_id = ANY (student_ids)
      OR inscription_id = ANY (inscription_ids);

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO payment_ids
    FROM public.payments
   WHERE student_id = ANY (student_ids)
      OR inscription_id = ANY (inscription_ids)
      OR invoice_id = ANY (invoice_ids);

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO certificate_ids
    FROM public.certificates
   WHERE student_id = ANY (student_ids)
      OR inscription_id = ANY (inscription_ids);

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
    INTO auth_ids
    FROM auth.users
   WHERE email ILIKE 'zztest.p10.%@example.invalid';

  n_students := coalesce(array_length(student_ids, 1), 0);
  n_inscriptions := coalesce(array_length(inscription_ids, 1), 0);
  n_invoices := coalesce(array_length(invoice_ids, 1), 0);
  n_certificates := coalesce(array_length(certificate_ids, 1), 0);
  SELECT count(*) INTO n_surveys
    FROM public.satisfaction_surveys
   WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  n_auth := coalesce(array_length(auth_ids, 1), 0);
  SELECT count(*) INTO n_storage
    FROM storage.objects o
   WHERE o.bucket_id IN ('certificates', 'documents', 'funding-documents')
     AND (storage.foldername(o.name))[1] = ANY (
       SELECT x::text FROM unnest(student_ids) AS x
     );

  DELETE FROM public.payment_reminders
   WHERE payment_id = ANY (payment_ids)
      OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.payments WHERE id = ANY (payment_ids);
  UPDATE public.invoices SET related_invoice_id = NULL WHERE related_invoice_id = ANY (invoice_ids);
  DELETE FROM public.invoices WHERE id = ANY (invoice_ids);
  DELETE FROM public.certificates WHERE id = ANY (certificate_ids);
  DELETE FROM public.document_sendings WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.email_log
   WHERE inscription_id = ANY (inscription_ids)
      OR recipient_email ILIKE 'zztest.p10.%@example.invalid';
  DELETE FROM public.satisfaction_surveys
   WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.session_enrollments
   WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.accommodations WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.formation_costs WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.instructor_sessions WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.instructor_contracts WHERE inscription_id = ANY (inscription_ids);

  IF n_storage > 0 THEN
    BEGIN
      PERFORM set_config('session_replication_role', 'replica', true);
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Fichiers storage non supprimés (privilège insuffisant) : %', n_storage;
    END;
    BEGIN
      DELETE FROM storage.objects o
       WHERE o.bucket_id IN ('certificates', 'documents', 'funding-documents')
         AND (storage.foldername(o.name))[1] = ANY (
           SELECT x::text FROM unnest(student_ids) AS x
         );
      PERFORM set_config('session_replication_role', 'origin', true);
    EXCEPTION WHEN OTHERS THEN
      PERFORM set_config('session_replication_role', 'origin', true);
      RAISE NOTICE 'Fichiers storage non supprimés : %', SQLERRM;
    END;
  END IF;

  DELETE FROM public.inscriptions WHERE id = ANY (inscription_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY (auth_ids);
  DELETE FROM public.user_permissions WHERE user_id = ANY (auth_ids);
  DELETE FROM public.profiles WHERE id = ANY (auth_ids);
  DELETE FROM public.students WHERE id = ANY (student_ids);
  DELETE FROM auth.identities WHERE user_id = ANY (auth_ids);
  DELETE FROM auth.users WHERE id = ANY (auth_ids);

  journal := jsonb_build_object(
    'point', '10',
    'fixture', 'zztest.p10.*@example.invalid',
    'camille_inchangee', (SELECT count(*) FROM public.inscriptions WHERE code = 'FLI-260006'),
    'before', jsonb_build_object(
      'students', n_students,
      'inscriptions', n_inscriptions,
      'invoices', n_invoices,
      'certificates', n_certificates,
      'surveys', n_surveys,
      'auth_users', n_auth,
      'storage_objects', n_storage
    ),
    'after', jsonb_build_object(
      'students', (SELECT count(*) FROM public.students WHERE email ILIKE 'zztest.p10.%@example.invalid'),
      'inscriptions', (SELECT count(*) FROM public.inscriptions i JOIN public.students s ON s.id = i.student_id WHERE s.email ILIKE 'zztest.p10.%@example.invalid'),
      'auth_users', (SELECT count(*) FROM auth.users WHERE email ILIKE 'zztest.p10.%@example.invalid')
    )
  );

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES ('cleanup_zztest_point10', 'inscriptions', journal);
END;
$cleanup$;

SELECT created_at, new_values
FROM public.audit_log
WHERE action = 'cleanup_zztest_point10'
ORDER BY created_at DESC
LIMIT 1;

SELECT i.code, i.status, s.email
FROM public.inscriptions i
JOIN public.students s ON s.id = i.student_id
WHERE i.code = 'FLI-260006';

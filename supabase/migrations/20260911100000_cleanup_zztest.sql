-- Kit de test Paula — nettoyage ZZTEST
--
-- Convention : nom commençant par ZZTEST et email @example.invalid.
-- Réversible au sens où la fonction ne touche que ces lignes.
-- La numérotation des factures n'a pas de compteur persistant :
-- before_invoice_insert reprend GREATEST(MAX(sequence_number), 14297)+1.

CREATE OR REPLACE FUNCTION public.cleanup_zztest_data(_dry_run boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  student_ids uuid[];
  inscription_ids uuid[];
  invoice_ids uuid[];
  payment_ids uuid[];
  certificate_ids uuid[];
  auth_ids uuid[];
  n_students integer := 0;
  n_inscriptions integer := 0;
  n_invoices integer := 0;
  n_payments integer := 0;
  n_certificates integer := 0;
  n_storage integer := 0;
  n_auth integer := 0;
  last_real_seq integer := 0;
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à un compte administrateur'
      USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(array_agg(s.id), ARRAY[]::uuid[])
    INTO student_ids
  FROM public.students s
  WHERE (
      s.first_name ILIKE 'ZZTEST%'
      OR s.last_name ILIKE 'ZZTEST%'
    )
    AND s.email ILIKE '%@example.invalid';

  n_students := coalesce(array_length(student_ids, 1), 0);

  SELECT coalesce(array_agg(i.id), ARRAY[]::uuid[])
    INTO inscription_ids
  FROM public.inscriptions i
  WHERE i.student_id = ANY (student_ids);

  n_inscriptions := coalesce(array_length(inscription_ids, 1), 0);

  SELECT coalesce(array_agg(inv.id), ARRAY[]::uuid[])
    INTO invoice_ids
  FROM public.invoices inv
  WHERE inv.inscription_id = ANY (inscription_ids);

  n_invoices := coalesce(array_length(invoice_ids, 1), 0);

  SELECT coalesce(array_agg(p.id), ARRAY[]::uuid[])
    INTO payment_ids
  FROM public.payments p
  WHERE p.inscription_id = ANY (inscription_ids)
     OR p.invoice_id = ANY (invoice_ids)
     OR p.payer_name ILIKE 'ZZTEST%'
     OR coalesce(p.reference, '') ILIKE 'ZZTEST%'
     OR coalesce(p.notes, '') ILIKE 'ZZTEST%';

  n_payments := coalesce(array_length(payment_ids, 1), 0);

  SELECT coalesce(array_agg(c.id), ARRAY[]::uuid[])
    INTO certificate_ids
  FROM public.certificates c
  WHERE c.student_id = ANY (student_ids)
     OR c.inscription_id = ANY (inscription_ids);

  n_certificates := coalesce(array_length(certificate_ids, 1), 0);

  SELECT coalesce(array_agg(DISTINCT s.auth_user_id) FILTER (WHERE s.auth_user_id IS NOT NULL), ARRAY[]::uuid[])
    INTO auth_ids
  FROM public.students s
  WHERE s.id = ANY (student_ids);

  n_auth := coalesce(array_length(auth_ids, 1), 0);

  SELECT count(*)::integer INTO n_storage
  FROM storage.objects o
  WHERE o.bucket_id IN ('certificates', 'documents', 'funding-documents')
    AND (storage.foldername(o.name))[1] = ANY (
      SELECT x::text FROM unnest(student_ids) AS x
    );

  SELECT GREATEST(coalesce(MAX(sequence_number), 0), 14297)
    INTO last_real_seq
  FROM public.invoices
  WHERE id <> ALL (invoice_ids);

  result := jsonb_build_object(
    'dry_run', _dry_run,
    'students', n_students,
    'inscriptions', n_inscriptions,
    'invoices', n_invoices,
    'payments', n_payments,
    'certificates', n_certificates,
    'storage_objects', n_storage,
    'auth_users', n_auth,
    'last_real_invoice_sequence', last_real_seq,
    'next_invoice_sequence', last_real_seq + 1
  );

  IF _dry_run THEN
    INSERT INTO public.audit_log (action, table_name, new_values)
    VALUES ('cleanup_zztest_dry_run', 'students', result);
    RETURN result;
  END IF;

  -- Écriture : ordre FK
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
     OR recipient_email ILIKE '%@example.invalid';
  DELETE FROM public.funding_documents
  WHERE funding_request_id IN (
    SELECT id FROM public.funding_requests WHERE inscription_id = ANY (inscription_ids)
  );
  DELETE FROM public.funding_requests WHERE inscription_id = ANY (inscription_ids);
  UPDATE public.inscriptions
     SET entry_test_id = NULL, exit_test_id = NULL
   WHERE id = ANY (inscription_ids);
  DELETE FROM public.placement_tests WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.satisfaction_surveys WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.session_enrollments WHERE student_id = ANY (student_ids) OR inscription_id = ANY (inscription_ids);
  DELETE FROM public.accommodations WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.formation_costs WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.instructor_sessions WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.instructor_contracts WHERE inscription_id = ANY (inscription_ids);
  UPDATE public.leads SET inscription_id = NULL WHERE inscription_id = ANY (inscription_ids);
  DELETE FROM public.test_evaluations
  WHERE booking_id IN (
    SELECT b.id FROM public.test_bookings b
    JOIN public.test_candidates c ON c.id = b.candidate_id
    WHERE c.student_id = ANY (student_ids)
  );
  DELETE FROM public.test_bookings
  WHERE candidate_id IN (
    SELECT id FROM public.test_candidates WHERE student_id = ANY (student_ids)
  );
  DELETE FROM public.test_candidates WHERE student_id = ANY (student_ids);
  DELETE FROM public.notifications WHERE user_id = ANY (auth_ids);
  DELETE FROM public.user_permissions WHERE user_id = ANY (auth_ids);

  PERFORM set_config('session_replication_role', 'replica', true);
  BEGIN
    DELETE FROM storage.objects o
    WHERE o.bucket_id IN ('certificates', 'documents', 'funding-documents')
      AND (storage.foldername(o.name))[1] = ANY (
        SELECT x::text FROM unnest(student_ids) AS x
      );
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('session_replication_role', 'origin', true);
    RAISE;
  END;
  PERFORM set_config('session_replication_role', 'origin', true);

  DELETE FROM public.inscriptions WHERE id = ANY (inscription_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY (auth_ids);
  DELETE FROM public.profiles WHERE id = ANY (auth_ids);
  DELETE FROM public.students WHERE id = ANY (student_ids);

  IF n_auth > 0 THEN
    DELETE FROM auth.identities WHERE user_id = ANY (auth_ids);
    DELETE FROM auth.users WHERE id = ANY (auth_ids);
  END IF;

  result := result || jsonb_build_object('deleted', true);

  INSERT INTO public.audit_log (action, table_name, new_values)
  VALUES ('cleanup_zztest', 'students', result);

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.cleanup_zztest_data(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_zztest_data(boolean) TO authenticated;

COMMENT ON FUNCTION public.cleanup_zztest_data(boolean) IS
  'Supprime les jeux de test ZZTEST / @example.invalid. dry_run=true par défaut. Admin uniquement.';

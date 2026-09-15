-- cleanup_zztest_data : plus d'arrêt bloquant sur le stockage.
-- Les fichiers sont supprimés par supabase/functions/cleanup-zztest (clé service)
-- avant l'RPC. Le plancher de séquence se lit dans app_settings (plus 14297 en dur).

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
  phrase_ids uuid[];
  n_students integer := 0;
  n_inscriptions integer := 0;
  n_invoices integer := 0;
  n_payments integer := 0;
  n_certificates integer := 0;
  n_storage integer := 0;
  n_auth integer := 0;
  n_phrases integer := 0;
  last_real_seq integer := 0;
  a_supprimer jsonb := '[]'::jsonb;
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

  SELECT coalesce(array_agg(p.id), ARRAY[]::uuid[])
    INTO phrase_ids
  FROM public.test_phrases p
  WHERE p.code ILIKE 'ZZTEST%'
     OR p.text_fr ILIKE '%ZZTEST%';

  n_phrases := coalesce(array_length(phrase_ids, 1), 0);

  SELECT count(*)::integer INTO n_storage
  FROM storage.objects o
  WHERE o.bucket_id IN ('certificates', 'documents', 'funding-documents')
    AND (storage.foldername(o.name))[1] = ANY (
      SELECT x::text FROM unnest(student_ids) AS x
    );

  SELECT GREATEST(
    coalesce(MAX(sequence_number), 0),
    coalesce((
      SELECT (value #>> '{}')::integer
      FROM public.app_settings
      WHERE key = 'invoice_sequence_floor'
    ), 0)
  )
    INTO last_real_seq
  FROM public.invoices
  WHERE id <> ALL (invoice_ids);

  SELECT coalesce(jsonb_agg(d ORDER BY d->>'stagiaire'), '[]'::jsonb)
    INTO a_supprimer
  FROM (
    SELECT jsonb_build_object(
      'stagiaire', s.first_name || ' ' || s.last_name,
      'cree_le', to_char(s.created_at, 'YYYY-MM-DD HH24:MI'),
      'cree_par', coalesce((
        SELECT u.email
        FROM public.audit_log a
        LEFT JOIN auth.users u ON u.id = a.user_id
        WHERE a.table_name = 'students'
          AND a.action = 'create'
          AND a.new_values->>'id' = s.id::text
        ORDER BY a.created_at
        LIMIT 1
      ), 'inconnu (script SQL ou import)'),
      'inscriptions', (
        SELECT coalesce(jsonb_agg(i.code ORDER BY i.code), '[]'::jsonb)
        FROM public.inscriptions i
        WHERE i.student_id = s.id
      )
    ) AS d
    FROM public.students s
    WHERE s.id = ANY (student_ids)
  ) t;

  result := jsonb_build_object(
    'dry_run', _dry_run,
    'students', n_students,
    'inscriptions', n_inscriptions,
    'invoices', n_invoices,
    'payments', n_payments,
    'certificates', n_certificates,
    'storage_objects', n_storage,
    'auth_users', n_auth,
    'test_phrases', n_phrases,
    'a_supprimer', a_supprimer,
    'last_real_invoice_sequence', last_real_seq,
    'next_invoice_sequence', last_real_seq + 1
  );

  IF _dry_run THEN
    INSERT INTO public.audit_log (action, table_name, new_values)
    VALUES ('cleanup_zztest_dry_run', 'students', result);
    RETURN result;
  END IF;

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
  DELETE FROM public.test_phrases WHERE id = ANY (phrase_ids);

  -- Stockage : l'edge function cleanup-zztest (clé service) supprime les
  -- fichiers AVANT cet RPC. Ne plus arrêter l'exécution s'il en reste.
  IF n_storage > 0 THEN
    result := result || jsonb_build_object(
      'storage_warning',
      n_storage || ' fichier(s) encore présents — l''edge function cleanup-zztest les retire via l''API Storage avant cet RPC'
    );
  END IF;

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

GRANT EXECUTE ON FUNCTION public.cleanup_zztest_data(boolean) TO authenticated;

COMMENT ON FUNCTION public.cleanup_zztest_data(boolean) IS
  'Nettoyage ZZTEST. Fichiers Storage via l''edge function cleanup-zztest. Séquence : GREATEST(MAX hors ZZTEST, invoice_sequence_floor).';

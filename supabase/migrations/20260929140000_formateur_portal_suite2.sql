-- Portail formateur tranche 2 : lecture paiements / contrats + CV Storage + modèle email invite

DROP POLICY IF EXISTS "rls_instructor_payments_select_formateur" ON public.instructor_payments;
CREATE POLICY "rls_instructor_payments_select_formateur"
  ON public.instructor_payments
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
  );

DROP POLICY IF EXISTS "rls_instructor_contracts_select_formateur" ON public.instructor_contracts;
CREATE POLICY "rls_instructor_contracts_select_formateur"
  ON public.instructor_contracts
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
  );

-- CV déposé sous documents/staff/instructors/<instructor_id>/…
DROP POLICY IF EXISTS "rls_documents_storage_select_formateur_own" ON storage.objects;
CREATE POLICY "rls_documents_storage_select_formateur_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_formateur()
    AND (storage.foldername(name))[1] = 'staff'
    AND (storage.foldername(name))[2] = 'instructors'
    AND (storage.foldername(name))[3] = public.get_my_instructor_id()::text
  );

INSERT INTO public.email_templates (slug, subject_fr, body_fr, variables, is_active)
VALUES (
  'formateur_portal_invite',
  'Accès à votre espace formateur — France Langues International',
  $html$
<p>Bonjour {{formateur_name}},</p>
<p>Votre espace formateur·rice FLI est prêt.</p>
<p><a href="{{magic_link}}">Accéder à mon espace formateur</a></p>
<p>Ce lien est valable {{link_expiry_label}}.</p>
<p>L’équipe FLI</p>
$html$,
  '["formateur_name","magic_link","link_expiry_label"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  is_active = true,
  updated_at = now();

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_portal_suite2_rls',
  'instructor_payments',
  jsonb_build_object(
    'migration', '20260929140000_formateur_portal_suite2',
    'policies', jsonb_build_array(
      'rls_instructor_payments_select_formateur',
      'rls_instructor_contracts_select_formateur',
      'rls_documents_storage_select_formateur_own'
    ),
    'email_template', 'formateur_portal_invite'
  )
);

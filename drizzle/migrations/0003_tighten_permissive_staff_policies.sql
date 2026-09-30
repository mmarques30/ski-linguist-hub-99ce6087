-- notifications: only staff/formateurs, only toward admins (notifyAdmins)
DROP POLICY IF EXISTS "Staff can insert notifications" ON public.notifications;
CREATE POLICY "Staff can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK ((public.is_staff() OR public.is_formateur()) AND public.has_role(user_id, 'admin'));

-- audit_log: staff only, attributed to themselves (triggers use SECURITY DEFINER)
DROP POLICY IF EXISTS "rls_audit_log_insert" ON public.audit_log;
CREATE POLICY "rls_audit_log_insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND (user_id IS NULL OR user_id = auth.uid()));

-- Read-only staff tables
DROP POLICY IF EXISTS "Staff can view email_templates" ON public.email_templates;
CREATE POLICY "Staff can view email_templates" ON public.email_templates FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Staff can view email_models" ON public.email_models;
CREATE POLICY "Staff can view email_models" ON public.email_models FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Staff can view qualiopi_indicators" ON public.qualiopi_indicators;
CREATE POLICY "Staff can view qualiopi_indicators" ON public.qualiopi_indicators FOR SELECT TO authenticated USING (public.is_staff());

-- Staff CRUD tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['prospects','scheduled_reminders','sessions','session_enrollments','ski_schools','schools_invoice_policy','seasons'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can view '||t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can insert '||t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can update '||t, t);
    IF t <> 'seasons' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff())', 'Staff can view '||t, t);
    END IF;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff())', 'Staff can insert '||t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', 'Staff can update '||t, t);
  END LOOP;
END $$;

-- Seasons: readable by any app role (non-sensitive calendar data)
CREATE POLICY "Staff can view seasons" ON public.seasons FOR SELECT TO authenticated
  USING (public.is_staff() OR public.is_formateur() OR public.is_student());

-- organization-assets: public bucket (public URLs keep working); listing restricted to staff
DROP POLICY IF EXISTS "rls_organization_assets_select_public" ON storage.objects;
CREATE POLICY "rls_organization_assets_select_public" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'organization-assets' AND public.is_staff());
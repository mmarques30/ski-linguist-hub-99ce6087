-- Sécurité — resserrer policies staff encore USING/WITH CHECK (true),
-- supprimer policies student orphelines (mauvais nom au DROP),
-- durcir notify_admins, DROP défensif des anciennes policies publiques.
--
-- Contexte audit 2026-11-02 :
-- Les policies "Public can view students/inscriptions" (janv. 2026) ont déjà
-- disparu via DROP TABLE … CASCADE (20260114131558). On les DROP IF EXISTS
-- par prudence si un environnement diverge.
-- Le vrai trou restant dans supabase/migrations : policies « Staff can … »
-- TO authenticated USING (true) — tout compte connecté (student/formateur).
-- Aligné sur drizzle/migrations/0003_tighten_permissive_staff_policies.sql
-- (sans toucher organization-assets : SELECT public requis pour logos PDF/e-mail).

-- ---------------------------------------------------------------------------
-- 0. Défensif — anciennes policies publiques (no-op si déjà absentes)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view students" ON public.students;
DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;
DROP POLICY IF EXISTS "Public can view inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Anyone can insert inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Public can view professional_profiles" ON public.professional_profiles;
DROP POLICY IF EXISTS "Anyone can insert professional_profiles" ON public.professional_profiles;

-- ---------------------------------------------------------------------------
-- 1. Notifications / audit_log
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can insert notifications" ON public.notifications;
CREATE POLICY "Staff can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_staff() OR public.is_formateur())
    AND public.has_role(user_id, 'admin')
  );

DROP POLICY IF EXISTS "rls_audit_log_insert" ON public.audit_log;
CREATE POLICY "rls_audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND (user_id IS NULL OR user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. Tables « Staff can view … USING (true) » → is_staff()
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view email_templates" ON public.email_templates;
CREATE POLICY "Staff can view email_templates" ON public.email_templates
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Staff can view email_models" ON public.email_models;
CREATE POLICY "Staff can view email_models" ON public.email_models
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Staff can view qualiopi_indicators" ON public.qualiopi_indicators;
CREATE POLICY "Staff can view qualiopi_indicators" ON public.qualiopi_indicators
  FOR SELECT TO authenticated USING (public.is_staff());

-- prospects
DROP POLICY IF EXISTS "Staff can view prospects" ON public.prospects;
DROP POLICY IF EXISTS "Staff can insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Staff can update prospects" ON public.prospects;
CREATE POLICY "Staff can view prospects" ON public.prospects
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert prospects" ON public.prospects
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update prospects" ON public.prospects
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- scheduled_reminders
DROP POLICY IF EXISTS "Staff can view scheduled_reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Staff can insert scheduled_reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Staff can update scheduled_reminders" ON public.scheduled_reminders;
CREATE POLICY "Staff can view scheduled_reminders" ON public.scheduled_reminders
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert scheduled_reminders" ON public.scheduled_reminders
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update scheduled_reminders" ON public.scheduled_reminders
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- sessions
DROP POLICY IF EXISTS "Staff can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Staff can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Staff can update sessions" ON public.sessions;
CREATE POLICY "Staff can view sessions" ON public.sessions
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert sessions" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update sessions" ON public.sessions
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- session_enrollments
DROP POLICY IF EXISTS "Staff can view session_enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Staff can insert session_enrollments" ON public.session_enrollments;
DROP POLICY IF EXISTS "Staff can update session_enrollments" ON public.session_enrollments;
CREATE POLICY "Staff can view session_enrollments" ON public.session_enrollments
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert session_enrollments" ON public.session_enrollments
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update session_enrollments" ON public.session_enrollments
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ski_schools
DROP POLICY IF EXISTS "Staff can view ski_schools" ON public.ski_schools;
DROP POLICY IF EXISTS "Staff can insert ski_schools" ON public.ski_schools;
DROP POLICY IF EXISTS "Staff can update ski_schools" ON public.ski_schools;
CREATE POLICY "Staff can view ski_schools" ON public.ski_schools
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert ski_schools" ON public.ski_schools
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update ski_schools" ON public.ski_schools
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- schools_invoice_policy
DROP POLICY IF EXISTS "Staff can view schools_invoice_policy" ON public.schools_invoice_policy;
DROP POLICY IF EXISTS "Staff can insert schools_invoice_policy" ON public.schools_invoice_policy;
DROP POLICY IF EXISTS "Staff can update schools_invoice_policy" ON public.schools_invoice_policy;
CREATE POLICY "Staff can view schools_invoice_policy" ON public.schools_invoice_policy
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff can insert schools_invoice_policy" ON public.schools_invoice_policy
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update schools_invoice_policy" ON public.schools_invoice_policy
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- seasons (view : tout rôle app ; anon garde rls_seasons_public_current_select)
DROP POLICY IF EXISTS "Staff can view seasons" ON public.seasons;
DROP POLICY IF EXISTS "Staff can insert seasons" ON public.seasons;
DROP POLICY IF EXISTS "Staff can update seasons" ON public.seasons;
CREATE POLICY "Staff can view seasons" ON public.seasons
  FOR SELECT TO authenticated
  USING (public.is_staff() OR public.is_formateur() OR public.is_student());
CREATE POLICY "Staff can insert seasons" ON public.seasons
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update seasons" ON public.seasons
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ---------------------------------------------------------------------------
-- 3. Policies student orphelines (jamais droppées — mauvais nom au rewrite)
--    Remplacées par des versions qui exigent is_student().
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can view own student record" ON public.students;
-- rls_students_select_student (is_student + get_my_student_id) couvre déjà ce cas.

DROP POLICY IF EXISTS "Students can view own satisfaction_surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Students can update own satisfaction_surveys" ON public.satisfaction_surveys;
CREATE POLICY "rls_satisfaction_surveys_select_student" ON public.satisfaction_surveys
  FOR SELECT TO authenticated
  USING (public.is_student() AND student_id = public.get_my_student_id());
CREATE POLICY "rls_satisfaction_surveys_update_student" ON public.satisfaction_surveys
  FOR UPDATE TO authenticated
  USING (public.is_student() AND student_id = public.get_my_student_id())
  WITH CHECK (public.is_student() AND student_id = public.get_my_student_id());

DROP POLICY IF EXISTS "Students can view own session_enrollments" ON public.session_enrollments;
CREATE POLICY "rls_session_enrollments_select_student" ON public.session_enrollments
  FOR SELECT TO authenticated
  USING (public.is_student() AND student_id = public.get_my_student_id());

DROP POLICY IF EXISTS "Students can view enrolled sessions" ON public.sessions;
CREATE POLICY "rls_sessions_select_enrolled_student" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1
      FROM public.session_enrollments se
      WHERE se.session_id = sessions.id
        AND se.student_id = public.get_my_student_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. notify_admins — plus d'EXECUTE pour authenticated (spam)
--    Appels depuis fonctions SECURITY DEFINER (owner) + service_role OK.
--    Le front utilise notifyAdmins() → INSERT notifications (pas cette RPC).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_type text,
  p_title text,
  p_message text DEFAULT NULL,
  p_link text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Bloque un appel JWT authenticated non-staff/formateur.
  -- Anon via RPC token (auth.role = anon) et service_role restent autorisés.
  IF auth.role() = 'authenticated'
     AND NOT (public.is_staff() OR public.is_formateur()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT ur.user_id, p_type, p_title, p_message, p_link
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM = 'not authorized' THEN
      RAISE;
    END IF;
    RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admins(text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins(text, text, text, text) TO service_role;

COMMENT ON FUNCTION public.notify_admins(text, text, text, text) IS
  'Notifie chaque admin. EXECUTE réservé service_role (+ appels SECURITY DEFINER). Guard JWT staff/formateur.';

-- ---------------------------------------------------------------------------
-- 5. Journal
-- ---------------------------------------------------------------------------
INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'securite_rls_tighten_staff_orphan',
  'pg_policies',
  jsonb_build_object(
    'dropped_defensive_public', ARRAY[
      'Public can view students',
      'Public can view inscriptions',
      'Anyone can insert inscriptions',
      'Public can view professional_profiles',
      'Anyone can insert professional_profiles'
    ],
    'tightened_staff_using_true', true,
    'orphan_student_policies_replaced', true,
    'notify_admins_revoke_authenticated', true
  )
);


-- ============================================
-- 1. Helper functions
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- ============================================
-- 2. DROP ALL existing policies (except profiles, user_roles, user_permissions)
-- ============================================

-- accommodations
DROP POLICY IF EXISTS "Authenticated users can delete accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Authenticated users can insert accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Authenticated users can view accommodations" ON public.accommodations;

-- app_settings
DROP POLICY IF EXISTS "Authenticated users can manage app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can view app_settings" ON public.app_settings;

-- availability_requests
DROP POLICY IF EXISTS "Authenticated users can delete availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Authenticated users can insert availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Authenticated users can update availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Authenticated users can view availability_requests" ON public.availability_requests;

-- certificates
DROP POLICY IF EXISTS "Authenticated users can delete certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated users can insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated users can update certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON public.certificates;

-- continuous_improvement
DROP POLICY IF EXISTS "Authenticated users can delete continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Authenticated users can insert continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Authenticated users can update continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Authenticated users can view continuous_improvement" ON public.continuous_improvement;

-- cost_templates
DROP POLICY IF EXISTS "Authenticated users can delete cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Authenticated users can insert cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Authenticated users can update cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Authenticated users can view cost_templates" ON public.cost_templates;

-- document_sendings
DROP POLICY IF EXISTS "Authenticated users can delete document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Authenticated users can insert document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Authenticated users can update document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Authenticated users can view document_sendings" ON public.document_sendings;

-- fixed_costs
DROP POLICY IF EXISTS "Authenticated users can delete fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Authenticated users can insert fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Authenticated users can update fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Authenticated users can view fixed_costs" ON public.fixed_costs;

-- formation_costs
DROP POLICY IF EXISTS "Authenticated users can delete formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Authenticated users can insert formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Authenticated users can update formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Authenticated users can view formation_costs" ON public.formation_costs;

-- inscriptions
DROP POLICY IF EXISTS "Authenticated users can delete inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Authenticated users can insert inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Authenticated users can update inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Authenticated users can view inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Public can insert inscriptions" ON public.inscriptions;

-- instructor_availabilities
DROP POLICY IF EXISTS "Anyone can view instructor_availabilities" ON public.instructor_availabilities;
DROP POLICY IF EXISTS "Authenticated users can manage instructor_availabilities" ON public.instructor_availabilities;

-- instructor_contracts
DROP POLICY IF EXISTS "Anyone can update contracts for signature" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Anyone can view contracts by token" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Authenticated users can delete instructor_contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Authenticated users can insert instructor_contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Authenticated users can update instructor_contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Authenticated users can view instructor_contracts" ON public.instructor_contracts;

-- instructor_payments
DROP POLICY IF EXISTS "Authenticated users can delete instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Authenticated users can insert instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Authenticated users can update instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Authenticated users can view instructor_payments" ON public.instructor_payments;

-- instructors
DROP POLICY IF EXISTS "Authenticated users can delete instructors" ON public.instructors;
DROP POLICY IF EXISTS "Authenticated users can insert instructors" ON public.instructors;
DROP POLICY IF EXISTS "Authenticated users can update instructors" ON public.instructors;
DROP POLICY IF EXISTS "Authenticated users can view instructors" ON public.instructors;

-- invoices
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;

-- payments
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;

-- placement_test_questions
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.placement_test_questions;
DROP POLICY IF EXISTS "Authenticated users can manage questions" ON public.placement_test_questions;

-- placement_tests
DROP POLICY IF EXISTS "Anyone can insert placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Anyone can update placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Authenticated users can delete placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can view placement_tests" ON public.placement_tests;

-- prospects
DROP POLICY IF EXISTS "Authenticated users can delete prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can insert prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can update prospects" ON public.prospects;
DROP POLICY IF EXISTS "Authenticated users can view prospects" ON public.prospects;

-- satisfaction_surveys
DROP POLICY IF EXISTS "Anyone can insert satisfaction_surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Anyone can update satisfaction_surveys" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Anyone can view satisfaction_surveys by token" ON public.satisfaction_surveys;
DROP POLICY IF EXISTS "Authenticated users can delete satisfaction_surveys" ON public.satisfaction_surveys;

-- scheduled_reminders
DROP POLICY IF EXISTS "Authenticated users can delete scheduled_reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Authenticated users can insert scheduled_reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Authenticated users can update scheduled_reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "Authenticated users can view scheduled_reminders" ON public.scheduled_reminders;

-- schools_invoice_policy
DROP POLICY IF EXISTS "Authenticated users can manage schools_invoice_policy" ON public.schools_invoice_policy;
DROP POLICY IF EXISTS "Authenticated users can view schools_invoice_policy" ON public.schools_invoice_policy;

-- ski_schools
DROP POLICY IF EXISTS "Authenticated users can delete ski_schools" ON public.ski_schools;
DROP POLICY IF EXISTS "Authenticated users can insert ski_schools" ON public.ski_schools;
DROP POLICY IF EXISTS "Authenticated users can update ski_schools" ON public.ski_schools;
DROP POLICY IF EXISTS "Authenticated users can view ski_schools" ON public.ski_schools;

-- students
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Public can insert students" ON public.students;

-- test_bookings
DROP POLICY IF EXISTS "Authenticated users can manage test_bookings" ON public.test_bookings;
DROP POLICY IF EXISTS "Authenticated users can view test_bookings" ON public.test_bookings;
DROP POLICY IF EXISTS "Public can insert test_bookings" ON public.test_bookings;

-- test_candidates
DROP POLICY IF EXISTS "Authenticated users can manage test_candidates" ON public.test_candidates;
DROP POLICY IF EXISTS "Authenticated users can view test_candidates" ON public.test_candidates;
DROP POLICY IF EXISTS "Public can insert test_candidates" ON public.test_candidates;

-- test_criteria
DROP POLICY IF EXISTS "Anyone can view active test_criteria" ON public.test_criteria;
DROP POLICY IF EXISTS "Authenticated users can manage test_criteria" ON public.test_criteria;

-- test_evaluations
DROP POLICY IF EXISTS "Authenticated users can manage test_evaluations" ON public.test_evaluations;
DROP POLICY IF EXISTS "Authenticated users can view test_evaluations" ON public.test_evaluations;

-- test_phrases
DROP POLICY IF EXISTS "Anyone can view active test_phrases" ON public.test_phrases;
DROP POLICY IF EXISTS "Authenticated users can manage test_phrases" ON public.test_phrases;

-- ============================================
-- 3. RECREATE all policies
-- ============================================

-- ===================== FINANCIAL TABLES (admin-only delete) =====================

-- invoices
CREATE POLICY "Staff can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.is_admin());

-- fixed_costs
CREATE POLICY "Staff can view fixed_costs" ON public.fixed_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert fixed_costs" ON public.fixed_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update fixed_costs" ON public.fixed_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete fixed_costs" ON public.fixed_costs FOR DELETE TO authenticated USING (public.is_admin());

-- formation_costs
CREATE POLICY "Staff can view formation_costs" ON public.formation_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert formation_costs" ON public.formation_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update formation_costs" ON public.formation_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete formation_costs" ON public.formation_costs FOR DELETE TO authenticated USING (public.is_admin());

-- cost_templates
CREATE POLICY "Staff can view cost_templates" ON public.cost_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert cost_templates" ON public.cost_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update cost_templates" ON public.cost_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete cost_templates" ON public.cost_templates FOR DELETE TO authenticated USING (public.is_admin());

-- instructor_payments
CREATE POLICY "Staff can view instructor_payments" ON public.instructor_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert instructor_payments" ON public.instructor_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update instructor_payments" ON public.instructor_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete instructor_payments" ON public.instructor_payments FOR DELETE TO authenticated USING (public.is_admin());

-- payments
CREATE POLICY "Staff can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete payments" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());

-- ===================== MANAGEMENT TABLES (admin-only delete) =====================

-- students
CREATE POLICY "Staff can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete students" ON public.students FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Anon can insert students" ON public.students FOR INSERT TO anon WITH CHECK (true);

-- inscriptions
CREATE POLICY "Staff can view inscriptions" ON public.inscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert inscriptions" ON public.inscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update inscriptions" ON public.inscriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete inscriptions" ON public.inscriptions FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Anon can insert inscriptions" ON public.inscriptions FOR INSERT TO anon WITH CHECK (true);

-- instructors
CREATE POLICY "Staff can view instructors" ON public.instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert instructors" ON public.instructors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update instructors" ON public.instructors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete instructors" ON public.instructors FOR DELETE TO authenticated USING (public.is_admin());

-- accommodations
CREATE POLICY "Staff can view accommodations" ON public.accommodations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert accommodations" ON public.accommodations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update accommodations" ON public.accommodations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete accommodations" ON public.accommodations FOR DELETE TO authenticated USING (public.is_admin());

-- ski_schools
CREATE POLICY "Staff can view ski_schools" ON public.ski_schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert ski_schools" ON public.ski_schools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update ski_schools" ON public.ski_schools FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete ski_schools" ON public.ski_schools FOR DELETE TO authenticated USING (public.is_admin());

-- continuous_improvement
CREATE POLICY "Staff can view continuous_improvement" ON public.continuous_improvement FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert continuous_improvement" ON public.continuous_improvement FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update continuous_improvement" ON public.continuous_improvement FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete continuous_improvement" ON public.continuous_improvement FOR DELETE TO authenticated USING (public.is_admin());

-- document_sendings
CREATE POLICY "Staff can view document_sendings" ON public.document_sendings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert document_sendings" ON public.document_sendings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update document_sendings" ON public.document_sendings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete document_sendings" ON public.document_sendings FOR DELETE TO authenticated USING (public.is_admin());

-- certificates
CREATE POLICY "Staff can view certificates" ON public.certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update certificates" ON public.certificates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete certificates" ON public.certificates FOR DELETE TO authenticated USING (public.is_admin());

-- scheduled_reminders
CREATE POLICY "Staff can view scheduled_reminders" ON public.scheduled_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert scheduled_reminders" ON public.scheduled_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update scheduled_reminders" ON public.scheduled_reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete scheduled_reminders" ON public.scheduled_reminders FOR DELETE TO authenticated USING (public.is_admin());

-- availability_requests
CREATE POLICY "Staff can view availability_requests" ON public.availability_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert availability_requests" ON public.availability_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update availability_requests" ON public.availability_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete availability_requests" ON public.availability_requests FOR DELETE TO authenticated USING (public.is_admin());

-- schools_invoice_policy
CREATE POLICY "Staff can view schools_invoice_policy" ON public.schools_invoice_policy FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert schools_invoice_policy" ON public.schools_invoice_policy FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update schools_invoice_policy" ON public.schools_invoice_policy FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete schools_invoice_policy" ON public.schools_invoice_policy FOR DELETE TO authenticated USING (public.is_admin());

-- ===================== PUBLIC-FACING TABLES =====================

-- placement_tests (public access for shared links)
CREATE POLICY "Public can view placement_tests" ON public.placement_tests FOR SELECT USING (true);
CREATE POLICY "Public can insert placement_tests" ON public.placement_tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update placement_tests" ON public.placement_tests FOR UPDATE USING (true);
CREATE POLICY "Admin can delete placement_tests" ON public.placement_tests FOR DELETE TO authenticated USING (public.is_admin());

-- placement_test_questions
CREATE POLICY "Public can view active questions" ON public.placement_test_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage questions" ON public.placement_test_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- satisfaction_surveys (public access by token for survey form)
CREATE POLICY "Public can view surveys" ON public.satisfaction_surveys FOR SELECT USING (true);
CREATE POLICY "Public can update surveys" ON public.satisfaction_surveys FOR UPDATE USING (true);
CREATE POLICY "Staff can insert surveys" ON public.satisfaction_surveys FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can delete surveys" ON public.satisfaction_surveys FOR DELETE TO authenticated USING (public.is_admin());

-- instructor_contracts (public access for signature by token)
CREATE POLICY "Public can view contracts" ON public.instructor_contracts FOR SELECT USING (true);
CREATE POLICY "Public can update contracts" ON public.instructor_contracts FOR UPDATE USING (true);
CREATE POLICY "Staff can insert contracts" ON public.instructor_contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can delete contracts" ON public.instructor_contracts FOR DELETE TO authenticated USING (public.is_admin());

-- instructor_availabilities (public SELECT for booking, staff manage)
CREATE POLICY "Public can view availabilities" ON public.instructor_availabilities FOR SELECT USING (true);
CREATE POLICY "Staff can manage availabilities" ON public.instructor_availabilities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- test_candidates
CREATE POLICY "Staff can view test_candidates" ON public.test_candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert test_candidates" ON public.test_candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update test_candidates" ON public.test_candidates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete test_candidates" ON public.test_candidates FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Anon can insert test_candidates" ON public.test_candidates FOR INSERT TO anon WITH CHECK (true);

-- test_bookings
CREATE POLICY "Staff can view test_bookings" ON public.test_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert test_bookings" ON public.test_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update test_bookings" ON public.test_bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete test_bookings" ON public.test_bookings FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Anon can insert test_bookings" ON public.test_bookings FOR INSERT TO anon WITH CHECK (true);

-- ===================== INTERNAL TABLES =====================

-- app_settings
CREATE POLICY "Staff can view app_settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert app_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can delete app_settings" ON public.app_settings FOR DELETE TO authenticated USING (public.is_admin());

-- prospects
CREATE POLICY "Staff can view prospects" ON public.prospects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert prospects" ON public.prospects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update prospects" ON public.prospects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete prospects" ON public.prospects FOR DELETE TO authenticated USING (public.is_admin());

-- test_evaluations
CREATE POLICY "Staff can view test_evaluations" ON public.test_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert test_evaluations" ON public.test_evaluations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update test_evaluations" ON public.test_evaluations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete test_evaluations" ON public.test_evaluations FOR DELETE TO authenticated USING (public.is_admin());

-- test_phrases
CREATE POLICY "Public can view active phrases" ON public.test_phrases FOR SELECT USING (active = true);
CREATE POLICY "Staff can manage phrases" ON public.test_phrases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- test_criteria
CREATE POLICY "Public can view active criteria" ON public.test_criteria FOR SELECT USING (active = true);
CREATE POLICY "Staff can manage criteria" ON public.test_criteria FOR ALL TO authenticated USING (true) WITH CHECK (true);

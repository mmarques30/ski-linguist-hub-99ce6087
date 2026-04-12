
-- 1. Create is_staff() helper function
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'student'
  ) AND auth.uid() IS NOT NULL
$$;

-- =====================================================
-- 2. DROP ALL EXISTING POLICIES (except app_settings, email_templates, profiles, notifications which are already fine)
-- =====================================================

-- accommodations
DROP POLICY IF EXISTS "Admin can delete accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Staff can insert accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Staff can update accommodations" ON public.accommodations;
DROP POLICY IF EXISTS "Staff can view accommodations" ON public.accommodations;

-- audit_log
DROP POLICY IF EXISTS "Admin can delete audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Staff can view audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit_log" ON public.audit_log;

-- availability_requests
DROP POLICY IF EXISTS "Admin can delete availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Staff can insert availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Staff can update availability_requests" ON public.availability_requests;
DROP POLICY IF EXISTS "Staff can view availability_requests" ON public.availability_requests;

-- certificates
DROP POLICY IF EXISTS "Admin can delete certificates" ON public.certificates;
DROP POLICY IF EXISTS "Staff can insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Staff can update certificates" ON public.certificates;
DROP POLICY IF EXISTS "Staff can view certificates" ON public.certificates;
DROP POLICY IF EXISTS "Students can view own certificates" ON public.certificates;

-- continuous_improvement
DROP POLICY IF EXISTS "Admin can delete continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Staff can insert continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Staff can update continuous_improvement" ON public.continuous_improvement;
DROP POLICY IF EXISTS "Staff can view continuous_improvement" ON public.continuous_improvement;

-- cost_templates
DROP POLICY IF EXISTS "Admin can delete cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Staff can insert cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Staff can update cost_templates" ON public.cost_templates;
DROP POLICY IF EXISTS "Staff can view cost_templates" ON public.cost_templates;

-- document_sendings
DROP POLICY IF EXISTS "Admin can delete document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Staff can insert document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Staff can update document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Staff can view document_sendings" ON public.document_sendings;
DROP POLICY IF EXISTS "Students can view own document_sendings" ON public.document_sendings;

-- email_log
DROP POLICY IF EXISTS "Admin can delete email_log" ON public.email_log;
DROP POLICY IF EXISTS "Staff can insert email_log" ON public.email_log;
DROP POLICY IF EXISTS "Staff can view email_log" ON public.email_log;

-- fixed_costs
DROP POLICY IF EXISTS "Admin can delete fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Staff can insert fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Staff can update fixed_costs" ON public.fixed_costs;
DROP POLICY IF EXISTS "Staff can view fixed_costs" ON public.fixed_costs;

-- formation_costs
DROP POLICY IF EXISTS "Admin can delete formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Staff can insert formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Staff can update formation_costs" ON public.formation_costs;
DROP POLICY IF EXISTS "Staff can view formation_costs" ON public.formation_costs;

-- funding_documents
DROP POLICY IF EXISTS "Admin can delete funding_documents" ON public.funding_documents;
DROP POLICY IF EXISTS "Staff can insert funding_documents" ON public.funding_documents;
DROP POLICY IF EXISTS "Staff can update funding_documents" ON public.funding_documents;
DROP POLICY IF EXISTS "Staff can view funding_documents" ON public.funding_documents;

-- funding_requests
DROP POLICY IF EXISTS "Admin can delete funding_requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Staff can insert funding_requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Staff can update funding_requests" ON public.funding_requests;
DROP POLICY IF EXISTS "Staff can view funding_requests" ON public.funding_requests;

-- inscriptions
DROP POLICY IF EXISTS "Admin can delete inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Anon can insert inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Staff can insert inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Staff can update inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Staff can view inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Students can view own inscriptions" ON public.inscriptions;

-- instructor_availabilities
DROP POLICY IF EXISTS "Public can view availabilities" ON public.instructor_availabilities;
DROP POLICY IF EXISTS "Staff can manage availabilities" ON public.instructor_availabilities;

-- instructor_contracts
DROP POLICY IF EXISTS "Admin can delete contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Public can update contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Public can view contracts" ON public.instructor_contracts;
DROP POLICY IF EXISTS "Staff can insert contracts" ON public.instructor_contracts;

-- instructor_payments
DROP POLICY IF EXISTS "Admin can delete instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Staff can insert instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Staff can update instructor_payments" ON public.instructor_payments;
DROP POLICY IF EXISTS "Staff can view instructor_payments" ON public.instructor_payments;

-- instructor_sessions
DROP POLICY IF EXISTS "Admin can delete instructor_sessions" ON public.instructor_sessions;
DROP POLICY IF EXISTS "Staff can insert instructor_sessions" ON public.instructor_sessions;
DROP POLICY IF EXISTS "Staff can update instructor_sessions" ON public.instructor_sessions;
DROP POLICY IF EXISTS "Staff can view instructor_sessions" ON public.instructor_sessions;

-- instructors
DROP POLICY IF EXISTS "Admin can delete instructors" ON public.instructors;
DROP POLICY IF EXISTS "Staff can insert instructors" ON public.instructors;
DROP POLICY IF EXISTS "Staff can update instructors" ON public.instructors;
DROP POLICY IF EXISTS "Staff can view instructors" ON public.instructors;

-- invoices
DROP POLICY IF EXISTS "Admin can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can view invoices" ON public.invoices;

-- partners
DROP POLICY IF EXISTS "Admin can delete partners" ON public.partners;
DROP POLICY IF EXISTS "Staff can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Staff can update partners" ON public.partners;
DROP POLICY IF EXISTS "Staff can view partners" ON public.partners;

-- partner_contacts
DROP POLICY IF EXISTS "Admin can delete partner_contacts" ON public.partner_contacts;
DROP POLICY IF EXISTS "Staff can insert partner_contacts" ON public.partner_contacts;
DROP POLICY IF EXISTS "Staff can update partner_contacts" ON public.partner_contacts;
DROP POLICY IF EXISTS "Staff can view partner_contacts" ON public.partner_contacts;

-- partner_contracts
DROP POLICY IF EXISTS "Admin can delete partner_contracts" ON public.partner_contracts;
DROP POLICY IF EXISTS "Staff can insert partner_contracts" ON public.partner_contracts;
DROP POLICY IF EXISTS "Staff can update partner_contracts" ON public.partner_contracts;
DROP POLICY IF EXISTS "Staff can view partner_contracts" ON public.partner_contracts;

-- payments
DROP POLICY IF EXISTS "Admin can delete payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can update payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can view payments" ON public.payments;

-- payment_reminders
DROP POLICY IF EXISTS "Admin can delete payment_reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Staff can insert payment_reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Staff can update payment_reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Staff can view payment_reminders" ON public.payment_reminders;

-- placement_tests
DROP POLICY IF EXISTS "Admin can delete placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can insert placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can update placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Public can view placement_tests" ON public.placement_tests;
DROP POLICY IF EXISTS "Students can view own placement_tests" ON public.placement_tests;

-- placement_test_questions
DROP POLICY IF EXISTS "Public can view active questions" ON public.placement_test_questions;
DROP POLICY IF EXISTS "Staff can manage questions" ON public.placement_test_questions;

-- pricing_rules
DROP POLICY IF EXISTS "Admin can delete pricing_rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Staff can insert pricing_rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Staff can update pricing_rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Staff can view pricing_rules" ON public.pricing_rules;

-- =====================================================
-- 3. RECREATE POLICIES
-- =====================================================

-- ==================== FINANCIAL TABLES (admin-restricted write) ====================

-- INVOICES
CREATE POLICY "rls_invoices_select" ON public.invoices FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_invoices_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_invoices_update" ON public.invoices FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_invoices_delete" ON public.invoices FOR DELETE TO authenticated USING (is_admin());

-- PAYMENTS
CREATE POLICY "rls_payments_select" ON public.payments FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_payments_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_payments_update" ON public.payments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_payments_delete" ON public.payments FOR DELETE TO authenticated USING (is_admin());

-- FIXED_COSTS
CREATE POLICY "rls_fixed_costs_select" ON public.fixed_costs FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_fixed_costs_insert" ON public.fixed_costs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_fixed_costs_update" ON public.fixed_costs FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_fixed_costs_delete" ON public.fixed_costs FOR DELETE TO authenticated USING (is_admin());

-- FORMATION_COSTS
CREATE POLICY "rls_formation_costs_select" ON public.formation_costs FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_formation_costs_insert" ON public.formation_costs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_formation_costs_update" ON public.formation_costs FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_formation_costs_delete" ON public.formation_costs FOR DELETE TO authenticated USING (is_admin());

-- INSTRUCTOR_PAYMENTS
CREATE POLICY "rls_instructor_payments_select" ON public.instructor_payments FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_payments_insert" ON public.instructor_payments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_instructor_payments_update" ON public.instructor_payments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_instructor_payments_delete" ON public.instructor_payments FOR DELETE TO authenticated USING (is_admin());

-- COST_TEMPLATES
CREATE POLICY "rls_cost_templates_select" ON public.cost_templates FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_cost_templates_insert" ON public.cost_templates FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_cost_templates_update" ON public.cost_templates FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_cost_templates_delete" ON public.cost_templates FOR DELETE TO authenticated USING (is_admin());

-- PRICING_RULES
CREATE POLICY "rls_pricing_rules_select" ON public.pricing_rules FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_pricing_rules_insert" ON public.pricing_rules FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_pricing_rules_update" ON public.pricing_rules FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_pricing_rules_delete" ON public.pricing_rules FOR DELETE TO authenticated USING (is_admin());

-- ==================== OPERATIONAL TABLES (staff read/write, student own data) ====================

-- INSCRIPTIONS
CREATE POLICY "rls_inscriptions_select_staff" ON public.inscriptions FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_inscriptions_select_student" ON public.inscriptions FOR SELECT TO authenticated USING (is_student() AND student_id = get_my_student_id());
CREATE POLICY "rls_inscriptions_insert_staff" ON public.inscriptions FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_inscriptions_insert_anon" ON public.inscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "rls_inscriptions_update" ON public.inscriptions FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_inscriptions_delete" ON public.inscriptions FOR DELETE TO authenticated USING (is_admin());

-- STUDENTS (keep anon insert for public registration)
-- Note: students table policies are on the existing table
DO $$ BEGIN
  -- Check if policies exist before trying to drop
  DROP POLICY IF EXISTS "Admin can delete students" ON public.students;
  DROP POLICY IF EXISTS "Anon can insert students" ON public.students;
  DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
  DROP POLICY IF EXISTS "Staff can update students" ON public.students;
  DROP POLICY IF EXISTS "Staff can view students" ON public.students;
  DROP POLICY IF EXISTS "Students can view own data" ON public.students;
  DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE POLICY "rls_students_select_staff" ON public.students FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_students_select_student" ON public.students FOR SELECT TO authenticated USING (is_student() AND id = get_my_student_id());
CREATE POLICY "rls_students_insert_staff" ON public.students FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_students_insert_anon" ON public.students FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "rls_students_update" ON public.students FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_students_delete" ON public.students FOR DELETE TO authenticated USING (is_admin());

-- INSTRUCTORS
CREATE POLICY "rls_instructors_select" ON public.instructors FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_instructors_insert" ON public.instructors FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_instructors_update" ON public.instructors FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_instructors_delete" ON public.instructors FOR DELETE TO authenticated USING (is_admin());

-- INSTRUCTOR_SESSIONS
CREATE POLICY "rls_instructor_sessions_select" ON public.instructor_sessions FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_sessions_insert" ON public.instructor_sessions FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_instructor_sessions_update" ON public.instructor_sessions FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_sessions_delete" ON public.instructor_sessions FOR DELETE TO authenticated USING (is_admin());

-- INSTRUCTOR_CONTRACTS
CREATE POLICY "rls_instructor_contracts_select_staff" ON public.instructor_contracts FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_contracts_select_public" ON public.instructor_contracts FOR SELECT TO anon USING (true);
CREATE POLICY "rls_instructor_contracts_insert" ON public.instructor_contracts FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_instructor_contracts_update_staff" ON public.instructor_contracts FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_contracts_update_anon" ON public.instructor_contracts FOR UPDATE TO anon USING (true);
CREATE POLICY "rls_instructor_contracts_delete" ON public.instructor_contracts FOR DELETE TO authenticated USING (is_admin());

-- INSTRUCTOR_AVAILABILITIES
CREATE POLICY "rls_instructor_avail_select" ON public.instructor_availabilities FOR SELECT TO public USING (true);
CREATE POLICY "rls_instructor_avail_insert" ON public.instructor_availabilities FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_instructor_avail_update" ON public.instructor_availabilities FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_instructor_avail_delete" ON public.instructor_availabilities FOR DELETE TO authenticated USING (is_admin());

-- CERTIFICATES
CREATE POLICY "rls_certificates_select_staff" ON public.certificates FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_certificates_select_student" ON public.certificates FOR SELECT TO authenticated USING (is_student() AND student_id = get_my_student_id());
CREATE POLICY "rls_certificates_insert" ON public.certificates FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_certificates_update" ON public.certificates FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_certificates_delete" ON public.certificates FOR DELETE TO authenticated USING (is_admin());

-- ACCOMMODATIONS
CREATE POLICY "rls_accommodations_select" ON public.accommodations FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_accommodations_insert" ON public.accommodations FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_accommodations_update" ON public.accommodations FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_accommodations_delete" ON public.accommodations FOR DELETE TO authenticated USING (is_admin());

-- DOCUMENT_SENDINGS
CREATE POLICY "rls_document_sendings_select_staff" ON public.document_sendings FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_document_sendings_select_student" ON public.document_sendings FOR SELECT TO authenticated
  USING (is_student() AND inscription_id IN (SELECT id FROM public.inscriptions WHERE student_id = get_my_student_id()));
CREATE POLICY "rls_document_sendings_insert" ON public.document_sendings FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_document_sendings_update" ON public.document_sendings FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_document_sendings_delete" ON public.document_sendings FOR DELETE TO authenticated USING (is_admin());

-- AVAILABILITY_REQUESTS
CREATE POLICY "rls_availability_requests_select" ON public.availability_requests FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_availability_requests_insert" ON public.availability_requests FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_availability_requests_update" ON public.availability_requests FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_availability_requests_delete" ON public.availability_requests FOR DELETE TO authenticated USING (is_admin());

-- CONTINUOUS_IMPROVEMENT
CREATE POLICY "rls_continuous_improvement_select" ON public.continuous_improvement FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_continuous_improvement_insert" ON public.continuous_improvement FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_continuous_improvement_update" ON public.continuous_improvement FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_continuous_improvement_delete" ON public.continuous_improvement FOR DELETE TO authenticated USING (is_admin());

-- FUNDING_REQUESTS
CREATE POLICY "rls_funding_requests_select" ON public.funding_requests FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_funding_requests_insert" ON public.funding_requests FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_funding_requests_update" ON public.funding_requests FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_funding_requests_delete" ON public.funding_requests FOR DELETE TO authenticated USING (is_admin());

-- FUNDING_DOCUMENTS
CREATE POLICY "rls_funding_documents_select" ON public.funding_documents FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_funding_documents_insert" ON public.funding_documents FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_funding_documents_update" ON public.funding_documents FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_funding_documents_delete" ON public.funding_documents FOR DELETE TO authenticated USING (is_admin());

-- PARTNERS
CREATE POLICY "rls_partners_select" ON public.partners FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_partners_insert" ON public.partners FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_partners_update" ON public.partners FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_partners_delete" ON public.partners FOR DELETE TO authenticated USING (is_admin());

-- PARTNER_CONTACTS
CREATE POLICY "rls_partner_contacts_select" ON public.partner_contacts FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_partner_contacts_insert" ON public.partner_contacts FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_partner_contacts_update" ON public.partner_contacts FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_partner_contacts_delete" ON public.partner_contacts FOR DELETE TO authenticated USING (is_admin());

-- PARTNER_CONTRACTS
CREATE POLICY "rls_partner_contracts_select" ON public.partner_contracts FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_partner_contracts_insert" ON public.partner_contracts FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_partner_contracts_update" ON public.partner_contracts FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_partner_contracts_delete" ON public.partner_contracts FOR DELETE TO authenticated USING (is_admin());

-- PAYMENT_REMINDERS
CREATE POLICY "rls_payment_reminders_select" ON public.payment_reminders FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_payment_reminders_insert" ON public.payment_reminders FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_payment_reminders_update" ON public.payment_reminders FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_payment_reminders_delete" ON public.payment_reminders FOR DELETE TO authenticated USING (is_admin());

-- EMAIL_LOG
CREATE POLICY "rls_email_log_select" ON public.email_log FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_email_log_insert" ON public.email_log FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_email_log_delete" ON public.email_log FOR DELETE TO authenticated USING (is_admin());

-- AUDIT_LOG
CREATE POLICY "rls_audit_log_select" ON public.audit_log FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_audit_log_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rls_audit_log_delete" ON public.audit_log FOR DELETE TO authenticated USING (is_admin());

-- ==================== PUBLIC TABLES ====================

-- PLACEMENT_TESTS (public read/write for shared test links)
CREATE POLICY "rls_placement_tests_select_public" ON public.placement_tests FOR SELECT TO public USING (true);
CREATE POLICY "rls_placement_tests_insert_public" ON public.placement_tests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "rls_placement_tests_update_public" ON public.placement_tests FOR UPDATE TO public USING (true);
CREATE POLICY "rls_placement_tests_select_student" ON public.placement_tests FOR SELECT TO authenticated USING (is_student() AND student_id = get_my_student_id());
CREATE POLICY "rls_placement_tests_delete" ON public.placement_tests FOR DELETE TO authenticated USING (is_admin());

-- PLACEMENT_TEST_QUESTIONS (public read, admin write)
CREATE POLICY "rls_placement_test_questions_select" ON public.placement_test_questions FOR SELECT TO public USING (is_active = true);
CREATE POLICY "rls_placement_test_questions_insert" ON public.placement_test_questions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "rls_placement_test_questions_update" ON public.placement_test_questions FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "rls_placement_test_questions_delete" ON public.placement_test_questions FOR DELETE TO authenticated USING (is_admin());

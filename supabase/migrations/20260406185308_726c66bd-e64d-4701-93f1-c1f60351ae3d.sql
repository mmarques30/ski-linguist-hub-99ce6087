
-- Helper function: get the student_id for the current auth user
CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students
  WHERE auth_user_id = auth.uid()
  LIMIT 1
$$;

-- Helper function: check if current user is a student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'student'
  )
$$;

-- RLS: Students can view their own student record
CREATE POLICY "Students can view own student record"
ON public.students FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- RLS: Students can view their own inscriptions
CREATE POLICY "Students can view own inscriptions"
ON public.inscriptions FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can view own placement tests
CREATE POLICY "Students can view own placement_tests"
ON public.placement_tests FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can view own certificates
CREATE POLICY "Students can view own certificates"
ON public.certificates FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can view own satisfaction surveys
CREATE POLICY "Students can view own satisfaction_surveys"
ON public.satisfaction_surveys FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can update own satisfaction surveys
CREATE POLICY "Students can update own satisfaction_surveys"
ON public.satisfaction_surveys FOR UPDATE TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can view own session enrollments
CREATE POLICY "Students can view own session_enrollments"
ON public.session_enrollments FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id());

-- RLS: Students can view sessions they are enrolled in
CREATE POLICY "Students can view enrolled sessions"
ON public.sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.session_enrollments
    WHERE session_enrollments.session_id = sessions.id
    AND session_enrollments.student_id = public.get_my_student_id()
  )
);

-- RLS: Students can view document sendings for their inscriptions
CREATE POLICY "Students can view own document_sendings"
ON public.document_sendings FOR SELECT TO authenticated
USING (
  inscription_id IN (
    SELECT id FROM public.inscriptions WHERE student_id = public.get_my_student_id()
  )
);

-- Portail formateur : lecture des inscriptions / stagiaires / sessions rattachés
-- (layout + tableau de bord + planning + stagiaires).

CREATE POLICY "rls_inscriptions_select_formateur"
  ON public.inscriptions
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id IS NOT NULL
    AND instructor_id = public.get_my_instructor_id()
  );

CREATE POLICY "rls_students_select_formateur"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND EXISTS (
      SELECT 1
      FROM public.inscriptions i
      WHERE i.student_id = students.id
        AND i.instructor_id = public.get_my_instructor_id()
    )
  );

CREATE POLICY "rls_instructor_sessions_select_formateur"
  ON public.instructor_sessions
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND instructor_id = public.get_my_instructor_id()
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_portal_rls_inscriptions',
  'inscriptions',
  jsonb_build_object(
    'migration', '20260929130000_formateur_portal_inscriptions_rls',
    'policies', jsonb_build_array(
      'rls_inscriptions_select_formateur',
      'rls_students_select_formateur',
      'rls_instructor_sessions_select_formateur'
    )
  )
);

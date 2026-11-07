-- Formateur·rice : lecture des tests de placement liés à SES missions
-- (attentes auto-diagnostic + réponses pistes / vocabulaire sur la fiche stagiaire).

CREATE POLICY "rls_placement_tests_select_formateur"
  ON public.placement_tests
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND (
      EXISTS (
        SELECT 1
        FROM public.inscriptions i
        WHERE i.instructor_id = public.get_my_instructor_id()
          AND (
            i.entry_test_id = placement_tests.id
            OR i.id = placement_tests.inscription_id
            OR (
              placement_tests.student_id IS NOT NULL
              AND i.student_id = placement_tests.student_id
            )
          )
      )
    )
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_placement_tests_select',
  'placement_tests',
  jsonb_build_object(
    'migration', '20261022060000_formateur_placement_tests_select',
    'policy', 'rls_placement_tests_select_formateur'
  )
);

-- Formateur : empêcher d'attacher à son créneau une inscription / un stagiaire
-- qui appartient à un autre formateur (RLS insert trop large sur attendance_records).

DROP POLICY IF EXISTS "rls_attendance_records_insert_formateur" ON public.attendance_records;

CREATE POLICY "rls_attendance_records_insert_formateur"
  ON public.attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_formateur()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.attendance_slots s
      WHERE s.id = slot_id
        AND s.instructor_id = public.get_my_instructor_id()
    )
    AND EXISTS (
      SELECT 1
      FROM public.inscriptions i
      WHERE i.id = inscription_id
        AND i.instructor_id = public.get_my_instructor_id()
        AND i.student_id = student_id
    )
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'attendance_records_formateur_inscription_scope',
  'attendance_records',
  jsonb_build_object(
    'migration', '20261022140000_attendance_records_formateur_inscription_scope',
    'policy', 'rls_attendance_records_insert_formateur',
    'change', 'require inscription.instructor_id = get_my_instructor_id() and matching student_id'
  )
);

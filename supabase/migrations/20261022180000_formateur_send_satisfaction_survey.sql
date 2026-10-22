-- Envoi manuel questionnaire satisfaction (formateur / staff)
-- + suivi day0_sent_at + lecture formateur de SES enquêtes.

ALTER TABLE public.satisfaction_surveys
  ADD COLUMN IF NOT EXISTS day0_sent_at timestamptz;

COMMENT ON COLUMN public.satisfaction_surveys.day0_sent_at IS
  'Dernier envoi du lien day0 (cron collectif ou envoi manuel formateur/staff).';

DROP POLICY IF EXISTS "rls_satisfaction_surveys_select_formateur"
  ON public.satisfaction_surveys;
CREATE POLICY "rls_satisfaction_surveys_select_formateur"
  ON public.satisfaction_surveys
  FOR SELECT
  TO authenticated
  USING (
    public.is_formateur()
    AND EXISTS (
      SELECT 1
      FROM public.inscriptions i
      WHERE i.id = satisfaction_surveys.inscription_id
        AND i.instructor_id = public.get_my_instructor_id()
    )
  );

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'formateur_send_satisfaction_survey',
  'satisfaction_surveys',
  jsonb_build_object(
    'migration', '20261022180000_formateur_send_satisfaction_survey',
    'column', 'day0_sent_at',
    'policy', 'rls_satisfaction_surveys_select_formateur',
    'edge', 'send-satisfaction-survey'
  )
);

-- Test de fin de formation (sortie) — jeton public + RPC, sur le même
-- modèle que satisfaction_surveys. La colonne inscriptions.exit_test_id
-- existait déjà mais n'était jamais renseignée.

ALTER TABLE public.placement_tests
  ADD COLUMN IF NOT EXISTS invite_token uuid;

UPDATE public.placement_tests
SET invite_token = gen_random_uuid()
WHERE invite_token IS NULL;

ALTER TABLE public.placement_tests
  ALTER COLUMN invite_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN invite_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS placement_tests_invite_token_uidx
  ON public.placement_tests (invite_token);

ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS exit_test_invited_at timestamptz;

COMMENT ON COLUMN public.placement_tests.invite_token IS
  'Jeton public /exit-test/:token — test de fin (et éventuellement reprise).';
COMMENT ON COLUMN public.inscriptions.exit_test_invited_at IS
  'Premier envoi de l''invitation au test de fin de formation.';

CREATE OR REPLACE FUNCTION public.get_exit_test_context(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'test', jsonb_build_object(
      'id', pt.id,
      'invite_token', pt.invite_token,
      'language', pt.language,
      'status', pt.status,
      'completed_at', pt.completed_at,
      'score_percentage', pt.score_percentage,
      'determined_level', pt.determined_level,
      'correct_answers', pt.correct_answers,
      'total_questions', pt.total_questions
    ),
    'inscription', CASE WHEN i.id IS NOT NULL THEN jsonb_build_object(
      'id', i.id,
      'code', i.code,
      'language', i.language,
      'start_date', i.start_date,
      'end_date', i.end_date,
      'course_location', i.course_location
    ) ELSE NULL END,
    'student', CASE WHEN st.id IS NOT NULL THEN jsonb_build_object(
      'id', st.id,
      'first_name', st.first_name,
      'last_name', st.last_name,
      'email', st.email
    ) ELSE NULL END
  )
  INTO result
  FROM public.placement_tests pt
  INNER JOIN public.inscriptions i
    ON i.exit_test_id = pt.id
  LEFT JOIN public.students st ON st.id = pt.student_id
  WHERE pt.invite_token = p_token
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_exit_test_by_token(
  p_token uuid,
  p_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id uuid;
  v_already timestamptz;
BEGIN
  IF p_token IS NULL THEN
    RAISE EXCEPTION 'Token invalide';
  END IF;

  SELECT pt.id, pt.completed_at
  INTO v_test_id, v_already
  FROM public.placement_tests pt
  INNER JOIN public.inscriptions i ON i.exit_test_id = pt.id
  WHERE pt.invite_token = p_token
  LIMIT 1;

  IF v_test_id IS NULL THEN
    RAISE EXCEPTION 'Test de fin introuvable';
  END IF;

  IF v_already IS NOT NULL THEN
    RAISE EXCEPTION 'Test de fin déjà complété';
  END IF;

  UPDATE public.placement_tests
  SET
    answers = COALESCE(p_data->'answers', answers),
    correct_answers = COALESCE((p_data->>'correct_answers')::int, correct_answers),
    total_questions = COALESCE((p_data->>'total_questions')::int, total_questions),
    score_percentage = COALESCE((p_data->>'score_percentage')::numeric, score_percentage),
    determined_level = COALESCE(p_data->>'determined_level', determined_level),
    status = 'completed',
    completed_at = COALESCE((p_data->>'completed_at')::timestamptz, now())
  WHERE id = v_test_id;
END;
$$;

COMMENT ON FUNCTION public.get_exit_test_context(uuid) IS
  'Page publique /exit-test/:token — contexte test de fin (SECURITY DEFINER).';
COMMENT ON FUNCTION public.submit_exit_test_by_token(uuid, jsonb) IS
  'Page publique /exit-test/:token — enregistrement des résultats (SECURITY DEFINER).';

GRANT EXECUTE ON FUNCTION public.get_exit_test_context(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exit_test_by_token(uuid, jsonb) TO anon, authenticated;

-- Modèle e-mail (inactif tant que Paula n'a pas validé le brouillon).
INSERT INTO public.email_templates (
  slug, model_key, variant_label,
  subject_fr, body_fr, subject_en, body_en, subject_pt, body_pt,
  variables, is_active, updated_at
)
VALUES (
  'exit_test_invite',
  'exit_test',
  'Invitation test de fin',
  'Test de fin de formation {{language}} — obligatoire avant votre dossier',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Votre formation {{language}} arrive à son terme ({{end_date}}). Pour mesurer votre progression, merci de passer le <strong>test de fin de formation</strong>.</p>
<p style="margin:0 0 16px"><strong>Ce test est obligatoire</strong> : sans résultat, nous ne pourrons pas déclencher votre dossier de fin de formation (attestation, facture, certificat le cas échéant).</p>
<p style="margin:0 0 8px"><a href="{{exit_test_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Passer le test de fin</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse :<br/>{{exit_test_link}}</p>
<p style="margin:0 0 16px">Le test dure quelques minutes, sur le même principe que le test d'entrée.</p>
<p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:28px 0 16px"/>
<p style="margin:0;font-size:13px;line-height:1.5;color:#555">
<strong style="color:#111">FLI — France Langues International</strong><br/>
25 avenue de la Gare<br/>
73800 Montmélian<br/>
Tél. : 04 79 28 21 09<br/>
<a href="mailto:info@fli.fr" style="color:#111">info@fli.fr</a>
</p>
</td></tr>
</table>
</td></tr>
</table>$html$,
  '', '', '', '',
  '["student_name","language","end_date","exit_test_link"]'::jsonb,
  false,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  model_key = EXCLUDED.model_key,
  variant_label = EXCLUDED.variant_label,
  -- ne pas forcer is_active : Paula valide sur /admin/emails
  updated_at = now();

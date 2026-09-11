-- Point 8-minimal — modèles d'emails transactionnels FR
--
-- Ne pose pas RESEND_API_KEY. N'active aucun cron.
-- Réversible : docs/EMAILS_8_MINIMAL.md

-- ---------------------------------------------------------------------------
-- 1. Confirmation d'inscription (déclenchée par /register)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_templates (
  slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables, is_active
) VALUES (
  'inscription_confirmation',
  'Confirmation de votre inscription — France Langues International',
  'Your registration is confirmed — France Langues International',
  'Confirmação da sua inscrição — France Langues International',
  $html$<p>Bonjour {{student_name}},</p>
<p>Nous vous confirmons votre inscription à la formation <strong>{{language}}</strong>, du {{start_date}} au {{end_date}}.</p>
<p>Votre code d'inscription : <strong>{{inscription_code}}</strong></p>
<p>Nous reviendrons vers vous pour la suite du parcours (horaires, formateur·rice, accès à l'espace stagiaire).</p>
<p>Si vous avez une question, répondez à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{student_name}},</p>
<p>Your registration for <strong>{{language}}</strong> ({{start_date}} to {{end_date}}) is confirmed. Code: <strong>{{inscription_code}}</strong></p>
<p style="margin-top:24px">Kind regards,<br/>FLI — France Langues International<br/>25 avenue de la Gare, 73800 Montmélian<br/>04 79 28 21 09 · info@fli.fr</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>Confirmamos a sua inscrição na formação <strong>{{language}}</strong>, de {{start_date}} a {{end_date}}. Código: <strong>{{inscription_code}}</strong></p>
<p style="margin-top:24px">Com os melhores cumprimentos,<br/>FLI — France Langues International<br/>25 avenue de la Gare, 73800 Montmélian<br/>04 79 28 21 09 · info@fli.fr</p>$html$,
  '["student_name","language","start_date","end_date","inscription_code"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  subject_fr = EXCLUDED.subject_fr,
  subject_en = EXCLUDED.subject_en,
  subject_pt = EXCLUDED.subject_pt,
  body_fr = EXCLUDED.body_fr,
  body_en = EXCLUDED.body_en,
  body_pt = EXCLUDED.body_pt,
  variables = EXCLUDED.variables,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. Invitation à l'espace stagiaire (lien magique)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_templates (
  slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables, is_active
) VALUES (
  'student_portal_invite',
  'Accès à votre espace stagiaire — France Langues International',
  'Access your student portal — France Langues International',
  'Acesso ao seu espaço de formando — France Langues International',
  $html$<p>Bonjour {{student_name}},</p>
<p>Votre espace stagiaire est prêt. Cliquez sur le lien ci-dessous pour vous y connecter. Ce lien est personnel, à usage unique, et expire après un délai court.</p>
<p><a href="{{magic_link}}">Accéder à mon espace stagiaire</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message. Aucun accès ne sera ouvert sans votre action.</p>
<p>Pour toute question, répondez à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{student_name}},</p>
<p>Your student portal is ready. This link is personal and single-use:</p>
<p><a href="{{magic_link}}">Open my student portal</a></p>
<p style="margin-top:24px">Kind regards,<br/>FLI — France Langues International<br/>25 avenue de la Gare, 73800 Montmélian<br/>04 79 28 21 09 · info@fli.fr</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>O seu espaço de formando está pronto. Esta ligação é pessoal e de utilização única:</p>
<p><a href="{{magic_link}}">Aceder ao meu espaço</a></p>
<p style="margin-top:24px">Com os melhores cumprimentos,<br/>FLI — France Langues International<br/>25 avenue de la Gare, 73800 Montmélian<br/>04 79 28 21 09 · info@fli.fr</p>$html$,
  '["student_name","magic_link"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  subject_fr = EXCLUDED.subject_fr,
  subject_en = EXCLUDED.subject_en,
  subject_pt = EXCLUDED.subject_pt,
  body_fr = EXCLUDED.body_fr,
  body_en = EXCLUDED.body_en,
  body_pt = EXCLUDED.body_pt,
  variables = EXCLUDED.variables,
  is_active = true,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3. Sujet portugais du modèle J-10 (D-10 → J-10, accord inscription(s))
--     Aucun cron n'est créé ni réactivé ici.
-- ---------------------------------------------------------------------------

INSERT INTO public.email_templates (
  slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables, is_active
) VALUES (
  'schedule_validation_reminder',
  'FLI — Validation des horaires (J-10) — {{total_count}} inscription(s)',
  'FLI — Schedule validation (J-10) — {{total_count}} enrollment(s)',
  'FLI — Validação dos horários (J-10) — {{total_count}} inscrição(ões)',
  '<p>Bonjour,</p><p>Des inscriptions débutent dans <strong>10 jours</strong> ({{start_date}}) et nécessitent la validation des groupes matin / après-midi.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Ouvrir les horaires J-10 →</a></p>',
  '<p>Hello,</p><p>Enrollments start in <strong>10 days</strong> ({{start_date}}) and need morning / afternoon group validation.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Open J-10 schedule →</a></p>',
  '<p>Olá,</p><p>As inscrições começam dentro de <strong>10 dias</strong> ({{start_date}}) e precisam da validação dos grupos manhã / tarde.</p>{{groups_html}}<p><a href="{{dashboard_url}}">Abrir horários J-10 →</a></p>',
  '["start_date","total_count","groups_html","dashboard_url"]'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  subject_pt = 'FLI — Validação dos horários (J-10) — {{total_count}} inscrição(ões)',
  subject_fr = EXCLUDED.subject_fr,
  subject_en = EXCLUDED.subject_en,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
VALUES (
  'emails_8_minimal_modeles',
  'email_templates',
  jsonb_build_object(
    'migration', '20260911090000_emails_8_minimal',
    'slugs', jsonb_build_array(
      'inscription_confirmation',
      'student_portal_invite',
      'schedule_validation_reminder'
    ),
    'cron_actives', 0,
    'resend_key_in_repo', false
  )
);

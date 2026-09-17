-- Emails transactionnels FLI — 11 modèles / 17 textes (Paula 17/09/2026)
-- Option A : brouillons dans email_template_drafts. Aucun cron activé.
-- Les textes live ne partent qu'après « Valider et activer ».

-- ---------------------------------------------------------------------------
-- 1. Catalogue email_models
-- ---------------------------------------------------------------------------

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('inscription_confirmation', 1, 'Confirmation d''inscription', 'Inscription soumise (/register) — variantes individuel / collectif.', 'candidat', 'submit-registration', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('inscription_documents', 2, 'Dossier de formation (documents FIF-PL)', 'Tâche +30 min si payeur = stagiaire ; PJ générées.', 'candidat', 'send-inscription-documents', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('student_portal_invite', 3, 'Accès à l''espace stagiaire', 'Manuel ; inactif cette saison.', 'candidat', 'invite-student-portal', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('schedule_validation_reminder', 4, 'Rappel interne — horaires à répartir', 'J-11 7h15 puis toutes les 2 h de 8h à 20h.', 'interne', 'process-schedule-reminders', 'process-schedule-reminders')
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('invoice_reminder', 5, 'Relance de paiement', 'Cron 9 h : J+7, J+15, J+30 — destinataire = payeur.', 'client', 'process-invoice-reminders', 'process-invoice-reminders')
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('satisfaction_survey', 6, 'Questionnaire de satisfaction', 'Day0 7h15, formateur 17h30 veille, rappels J+5/J+30 8h15.', 'candidat', 'process-survey-reminders', 'process-survey-reminders')
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('schedule_convocation', 7, 'Convocation (formation collective)', 'Validation horaires ; renvoi si modification.', 'candidat', 'send-schedule-convocation', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('convention_to_sign', 8, 'Convention école à signer', 'Manuel depuis fiche école / groupe.', 'client', 'send-convention', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('training_completion_pack', 10, 'Documents de fin de formation', 'Cron matin selon payeur stagiaire ou école.', 'candidat', 'process-training-completion', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_models (model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname) VALUES
  ('training_completion_school_report', 11, 'Bilan de formation pour l''école', 'Préparé auto ; envoi après validation un clic.', 'client', 'send-school-report', NULL)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;


-- Anciens modèles point 8 : on les laisse en base pour historique,
-- mais on les retire de l'écran en poussant position hors liste (ou on les marque).
UPDATE public.email_models SET position = 90,
  title_fr = title_fr || ' (obsolète — remplacé)',
  trigger_fr = 'Remplacé par le pack 17/09/2026. Ne plus utiliser.'
WHERE model_key IN ('inscription_ski_monitor_welcome')
  AND title_fr NOT LIKE '%obsolète%';

-- ---------------------------------------------------------------------------
-- 2. Brouillons (tous les 17 textes)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'inscription_confirmation_individual', 'inscription_confirmation', 1, 'Individuel',
  $html$Votre inscription à la formation {{language}} est confirmée — {{inscription_code}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Nous vous confirmons votre inscription à la formation {{language}}, {{dates_label}}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;font-size:15px"><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Code d'inscription</td><td style="padding:4px 0"><strong>{{inscription_code}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Lieu</td><td style="padding:4px 0"><strong>{{course_location}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Modalité</td><td style="padding:4px 0"><strong>{{modality_label}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Votre piste de départ au test de placement</td><td style="padding:4px 0"><strong>{{slope_label}}</strong></td></tr></table>
<p style="margin:0 0 16px">Prochaines étapes : nous vous enverrons les documents de la formation pour que vous puissiez faire votre demande de prise en charge.</p>
<p style="margin:0 0 16px">Dès réception de votre dossier signé et confirmation du paiement, nous vous mettrons en contact avec votre formateur·rice pour organiser les séances.</p>
<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "inscription_code", "student_name", "dates_label", "course_location", "modality_label", "slope_label"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 01a · Confirmation d''inscription — dossier individuel. Destinataire : Stagiaire',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'inscription_confirmation_group', 'inscription_confirmation', 2, 'Collectif',
  $html$Votre inscription à la formation {{language}} est confirmée — {{inscription_code}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Nous vous confirmons votre inscription à la formation {{language}}, {{dates_label}}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;font-size:15px"><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Code d'inscription</td><td style="padding:4px 0"><strong>{{inscription_code}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Lieu</td><td style="padding:4px 0"><strong>{{course_location}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Modalité</td><td style="padding:4px 0"><strong>{{modality_label}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Votre piste de départ au test de placement</td><td style="padding:4px 0"><strong>{{slope_label}}</strong></td></tr></table>
<p style="margin:0 0 16px">Prochaines étapes : nous vous enverrons les documents de la formation pour que vous puissiez faire votre demande de prise en charge.</p>
<p style="margin:0 0 16px">Vous recevrez une convocation 10 jours avant le début de la formation, avec votre groupe, vos horaires et toutes les informations pratiques.</p>
<p style="margin:0 0 16px">Pour toute question, répondez à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "inscription_code", "student_name", "dates_label", "course_location", "modality_label", "slope_label"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 01b · Confirmation d''inscription — formation collective. Destinataire : Stagiaire',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'inscription_documents', 'inscription_documents', 1, 'Texte unique',
  $html$Votre dossier de formation {{language}} — {{inscription_code}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Vous trouverez en pièces jointes le dossier de votre formation {{language}} (inscription {{inscription_code}}) :</p>
<ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li><li style="margin:0 0 6px">Programme de la formation</li><li style="margin:0 0 6px">Critères de prise en charge FIF-PL</li><li style="margin:0 0 6px">Tutoriel pour la demande de prise en charge</li></ul>
<p style="margin:0 0 16px">Pensez à faire votre demande de prise en charge avant le début de la formation. Sans elle, le FIF-PL ne rembourse pas.</p>
<p style="margin:0 0 16px">Pour nous retourner la convention signée, répondez à ce message avec le document en pièce jointe : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "inscription_code", "student_name"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 02 · Dossier de formation (documents FIF-PL). Destinataire : Stagiaire payeur (uniquement si le payeur de l''inscription est le stagiaire lui-même)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'student_portal_invite', 'student_portal_invite', 1, 'Texte unique',
  $html$Votre accès à l'espace stagiaire FLI$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Votre espace stagiaire est prêt. Vous y trouverez vos documents, vos horaires et le suivi de votre formation.</p>
<p style="margin:0 0 8px"><a href="{{magic_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Accéder à mon espace stagiaire</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{magic_link}}</p>
<p style="margin:0 0 16px">Ce lien est personnel et valable {{link_expiry_label}}. Passé ce délai, demandez-en un nouveau en répondant à ce message.</p>
<p style="margin:0 0 16px">Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : aucun accès ne sera ouvert sans votre action.</p>
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
</table>$html$, '', '',
  '["student_name", "magic_link", "link_expiry_label"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 03 · Accès à l''espace stagiaire. Destinataire : Stagiaire',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'schedule_validation_reminder', 'schedule_validation_reminder', 1, 'Texte unique',
  $html${{days_before}} jour(s) avant le début : {{total_count}} inscription(s) à répartir pour le {{start_date}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Des formations débutent dans {{days_before}} jour(s) ({{start_date}}). {{total_count}} inscription(s) attendent encore la répartition matin / après-midi et l'affectation d'un·e formateur·rice.</p>
{{groups_html}}
<p style="margin:0 0 8px"><a href="{{dashboard_url}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Ouvrir les horaires à valider</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{dashboard_url}}</p>
<p style="margin:0 0 8px;font-size:13px;color:#555">Message interne FLI. Aucun stagiaire n'est en copie.</p>
</td></tr>
</table>
</td></tr>
</table>$html$, '', '',
  '["days_before", "total_count", "start_date", "groups_html", "dashboard_url", "groups_text"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 04 · Rappel interne — horaires à répartir. Destinataire : info@fli.fr (ou ADMIN_EMAIL). Message interne : pas de signature, pas de pied de page.',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'invoice_reminder_1', 'invoice_reminder', 1, 'J+7',
  $html$Facture {{invoice_number}} — rappel de règlement$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Sauf erreur de notre part, la facture {{invoice_number}} adressée à {{client_name}}, d'un montant de {{amount}} et échue le {{due_date}}, n'a pas encore été réglée.</p>
<p style="margin:0 0 16px">Nous vous remercions de procéder au règlement ou de nous indiquer la date prévue.</p>
<p style="margin:0 0 16px">Si votre paiement est déjà parti, ne tenez pas compte de ce message : nos règlements se croisent parfois.</p>
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
</table>$html$, '', '',
  '["invoice_number", "client_name", "amount", "due_date"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 05a · Relance de paiement J+7. Destinataire : Payeur de la facture (stagiaire, école, partenaire) — jamais le stagiaire par défaut',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'invoice_reminder_2', 'invoice_reminder', 2, 'J+15',
  $html$Facture {{invoice_number}} — deuxième rappel$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Malgré notre premier rappel, la facture {{invoice_number}} adressée à {{client_name}}, d'un montant de {{amount}} et échue le {{due_date}}, reste impayée ({{days_overdue}} jours de retard).</p>
<p style="margin:0 0 16px">Nous vous remercions de régulariser cette facture. Si un échelonnement vous aiderait, appelez-nous au 04 79 28 21 09 : nous trouverons une solution.</p>
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
</table>$html$, '', '',
  '["invoice_number", "client_name", "amount", "due_date", "days_overdue"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 05b · Relance de paiement J+15. Destinataire : Payeur de la facture',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'invoice_reminder_3', 'invoice_reminder', 3, 'J+30',
  $html$Dernier rappel avant mise en demeure — facture {{invoice_number}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Nos deux rappels précédents sont restés sans réponse. La facture {{invoice_number}} adressée à {{client_name}}, d'un montant de {{amount}} et échue le {{due_date}}, présente {{days_overdue}} jours de retard.</p>
<p style="margin:0 0 16px">Ce message est le dernier rappel avant mise en demeure. Sans règlement sous huit jours, nous engagerons une procédure de recouvrement et appliquerons les pénalités de retard et l'indemnité forfaitaire de 40 € pour frais de recouvrement prévues par la loi.</p>
<p style="margin:0 0 16px">Pour régler ou nous signaler une difficulté : 04 79 28 21 09 ou info@fli.fr.</p>
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
</table>$html$, '', '',
  '["invoice_number", "client_name", "amount", "due_date", "days_overdue"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 05c · Dernier rappel avant mise en demeure J+30. Destinataire : Payeur de la facture',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'satisfaction_survey_day0', 'satisfaction_survey', 1, 'Jour J (end_date)',
  $html$Votre avis sur votre formation {{language}} — deux minutes aujourd'hui$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Votre formation {{language}} se termine aujourd'hui. Avant de partir, prenez deux minutes pour nous donner votre avis, directement depuis votre téléphone.</p>
<p style="margin:0 0 8px"><a href="{{survey_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Donner mon avis</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{survey_link}}</p>
<p style="margin:0 0 16px">C'est notre seule mesure pour ajuster les contenus, le rythme et la composition des groupes. Vos réponses sont utilisées de façon agrégée dans notre suivi qualité Qualiopi.</p>
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
</table>$html$, '', '',
  '["language", "student_name", "survey_link"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 06a · Questionnaire de satisfaction — dernier jour. Destinataire : Stagiaire (tous les inscrits de la formation)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'satisfaction_survey_trainer_notice', 'satisfaction_survey', 2, 'Veille — formateur·rice',
  $html$Demain, dernier jour à {{course_location}} : dix minutes pour le questionnaire$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{trainer_first_name}},</p>
<p style="margin:0 0 16px">Ta formation {{language}} à {{course_location}} se termine demain, {{end_date}}.</p>
<p style="margin:0 0 16px">Les stagiaires recevront demain matin, par email, le lien vers leur questionnaire de satisfaction. Merci de garder dix minutes en fin de séance pour qu'ils le remplissent sur place, sur leur téléphone. C'est ce qui nous permet d'avoir un taux de réponse complet pour Qualiopi.</p>
<p style="margin:0 0 16px">Si un·e stagiaire n'a pas reçu le mail, il ou elle peut nous écrire à info@fli.fr et nous lui renvoyons le lien.</p>
<p style="margin:24px 0 0">Merci et bonne dernière journée,<br/>L'équipe FLI</p>
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
</table>$html$, '', '',
  '["course_location", "trainer_first_name", "language", "end_date"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 06b · Consigne questionnaire au formateur·rice (veille du dernier jour). Destinataire : Formateur·rice affecté·e au groupe (email de la fiche formateur·rice). Tutoiement : seule exception au vouvoiement.',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'satisfaction_survey_reminder_1', 'satisfaction_survey', 3, 'J+5',
  $html$Votre avis sur votre formation {{language}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Nous n'avons pas encore reçu votre questionnaire de satisfaction sur votre formation {{language}}, terminée le {{end_date}}.</p>
<p style="margin:0 0 16px">Il prend deux minutes. C'est notre seule mesure pour ajuster les contenus, le rythme et la composition des groupes.</p>
<p style="margin:0 0 8px"><a href="{{survey_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Donner mon avis</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{survey_link}}</p>
<p style="margin:0 0 16px">Vos réponses sont utilisées de façon agrégée dans notre suivi qualité Qualiopi.</p>
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
</table>$html$, '', '',
  '["language", "student_name", "end_date", "survey_link"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 06c · Questionnaire — rappel J+5. Destinataire : Stagiaire n''ayant pas répondu',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'satisfaction_survey_reminder_2', 'satisfaction_survey', 4, 'J+30',
  $html$Dernier rappel : votre avis sur votre formation {{language}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Nous n'avons pas encore reçu votre questionnaire de satisfaction sur votre formation {{language}}, terminée le {{end_date}}. C'est notre dernier rappel.</p>
<p style="margin:0 0 8px"><a href="{{survey_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Donner mon avis</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{survey_link}}</p>
<p style="margin:0 0 16px">Si vous préférez nous répondre en quelques mots, répondez simplement à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "student_name", "end_date", "survey_link"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 06d · Questionnaire — dernier rappel J+30. Destinataire : Stagiaire n''ayant pas répondu',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'schedule_convocation', 'schedule_convocation', 1, 'Texte unique',
  $html$Convocation : formation {{language}} à {{course_location}} du {{start_date}} au {{end_date}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Voici votre convocation à la formation {{language}} (inscription {{inscription_code}}).</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;font-size:15px"><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Dates</td><td style="padding:4px 0"><strong>du {{start_date}} au {{end_date}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Groupe et horaires</td><td style="padding:4px 0"><strong>{{schedule_label}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Lieu</td><td style="padding:4px 0"><strong>{{course_location}} — {{location_details}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Formateur·rice</td><td style="padding:4px 0"><strong>{{instructor_name}} — {{instructor_phone}}</strong></td></tr><tr><td style="color:#555;padding:4px 12px 4px 0;vertical-align:top">Durée totale</td><td style="padding:4px 0"><strong>{{total_hours}} heures</strong></td></tr></table>
<p style="margin:0 0 16px">Merci d'arriver quelques minutes avant le début de la première séance. Une feuille d'émargement sera à signer à chaque demi-journée : elle est exigée pour votre prise en charge.</p>
<p style="margin:0 0 16px">En cas d'empêchement, prévenez-nous dès que possible en répondant à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "course_location", "start_date", "end_date", "student_name", "inscription_code", "schedule_label", "location_details", "instructor_name", "instructor_phone", "total_hours"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 07 · Convocation (formation collective). Destinataire : Stagiaire',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'convention_to_sign', 'convention_to_sign', 1, 'Texte unique',
  $html$Convention de formation {{language}} — {{course_location}}, du {{start_date}} au {{end_date}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">Vous trouverez en pièce jointe la convention de formation professionnelle entre {{client_name}} et FLI pour la formation {{language}} à {{course_location}}, du {{start_date}} au {{end_date}}, pour {{student_count}} stagiaire(s).</p>
<p style="margin:0 0 16px">Merci de nous la retourner signée au plus tard le {{return_deadline}}, en répondant à ce message avec le document en pièce jointe.</p>
<p style="margin:0 0 16px">Le programme de la formation est joint pour information. Pour toute question sur le contenu ou les modalités de prise en charge, répondez à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "course_location", "start_date", "end_date", "client_name", "student_count", "return_deadline"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 08 · Convention école à signer. Destinataire : École de ski (adresse de contact de l''école)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'training_completion_pack_student', 'training_completion_pack', 1, 'Payeur stagiaire',
  $html$Fin de votre formation {{language}} : certificat, attestation et facture$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Votre formation {{language}} (inscription {{inscription_code}}) s'est terminée le {{end_date}}. Vous trouverez en pièces jointes :</p>
<ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Certificat de fin de formation</li><li style="margin:0 0 6px">Attestation de présence</li><li style="margin:0 0 6px">Facture acquittée {{invoice_number}}</li></ul>
<p style="margin:0 0 16px">Ces documents constituent votre dossier de remboursement FIF-PL. Transmettez-les à votre organisme dès que possible.</p>
<p style="margin:0 0 16px">Si vous ne l'avez pas encore fait, donnez-nous votre avis sur la formation, deux minutes depuis votre téléphone :</p>
<p style="margin:0 0 8px"><a href="{{survey_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Donner mon avis</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{survey_link}}</p>
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
</table>$html$, '', '',
  '["language", "student_name", "inscription_code", "end_date", "invoice_number", "survey_link"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 10a · Documents de fin de formation — payeur stagiaire. Destinataire : Stagiaire (payeur = stagiaire)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'training_completion_pack_school', 'training_completion_pack', 2, 'Payeur école',
  $html$Votre certificat de fin de formation {{language}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Votre formation {{language}} (inscription {{inscription_code}}) s'est terminée le {{end_date}}. Vous trouverez en pièce jointe votre certificat de fin de formation.</p>
<p style="margin:0 0 16px">Si vous ne l'avez pas encore fait, donnez-nous votre avis sur la formation, deux minutes depuis votre téléphone :</p>
<p style="margin:0 0 8px"><a href="{{survey_link}}" style="display:inline-block;padding:12px 18px;background:#111;color:#ffffff;text-decoration:none">Donner mon avis</a></p>
<p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br/>{{survey_link}}</p>
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
</table>$html$, '', '',
  '["language", "student_name", "inscription_code", "end_date", "survey_link"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 10b · Certificat de fin de formation — payeur école. Destinataire : Stagiaire (payeur = école de ski)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
) VALUES (
  'training_completion_school_report', 'training_completion_school_report', 1, 'Texte unique',
  $html$Bilan de la formation {{language}} à {{course_location}} du {{start_date}} au {{end_date}}$html$, '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">La formation {{language}} organisée pour {{client_name}} à {{course_location}}, du {{start_date}} au {{end_date}}, s'est achevée. Vous trouverez en pièces jointes :</p>
<ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Facture {{invoice_number}}</li><li style="margin:0 0 6px">Certificats de fin de formation de vos {{student_count}} moniteur·rices, un par personne</li><li style="margin:0 0 6px">Tableau récapitulatif des niveaux atteints en fin de formation</li></ul>
<p style="margin:0 0 16px">Le tableau vous donne, pour chaque moniteur·rice, le niveau atteint en fin de formation. Il peut servir de base pour la saison prochaine.</p>
<p style="margin:0 0 16px">Pour toute question sur la facture ou les résultats, répondez à ce message : il arrive directement à info@fli.fr.</p>
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
</table>$html$, '', '',
  '["language", "course_location", "start_date", "end_date", "client_name", "invoice_number", "student_count"]'::jsonb,
  'Pack emails-fli 17/09/2026 · 11 · Bilan de formation pour l''école. Destinataire : École de ski (adresse de contact de l''école)',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  position = EXCLUDED.position,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();


-- ---------------------------------------------------------------------------
-- 3. Ancien welcome moniteur : désactiver seulement ce slug remplacé
-- ---------------------------------------------------------------------------
UPDATE public.email_templates
SET is_active = false, updated_at = now()
WHERE slug = 'inscription_ski_monitor_welcome';

-- On garde `inscription_confirmation` actif comme repli tant que
-- `inscription_confirmation_individual` / `_group` ne sont pas publiés.
-- Aucune publication automatique des 17 nouveaux textes.
-- Aucun cron activé.

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'emails_11_modeles_brouillons',
  'email_template_drafts',
  jsonb_build_object(
    'migration', '20260917180000_emails_11_modeles_paula',
    'brouillons', (SELECT count(*) FROM public.email_template_drafts),
    'modeles_catalogue', (SELECT count(*) FROM public.email_models WHERE position < 90),
    'crons_actives', 0
  );

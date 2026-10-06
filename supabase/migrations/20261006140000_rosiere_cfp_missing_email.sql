-- Demande CFP automatique — moniteurs La Rosière sans pièces FIF-PL.
-- Envoi : submit-registration à l'inscription + send-rosiere-cfp-request (backfill).

INSERT INTO public.email_models (
  model_key, position, title_fr, trigger_fr, audience, edge_function, cron_jobname
) VALUES (
  'rosiere_cfp_missing',
  12,
  'Attestation CFP — La Rosière',
  'Envoyé à l''inscription d''un moniteur La Rosière si statut / attestation CFP / autre FIF-PL 2026 manquent.',
  'candidat',
  'submit-registration',
  NULL
)
ON CONFLICT (model_key) DO UPDATE SET
  position = EXCLUDED.position,
  title_fr = EXCLUDED.title_fr,
  trigger_fr = EXCLUDED.trigger_fr,
  audience = EXCLUDED.audience,
  edge_function = EXCLUDED.edge_function,
  cron_jobname = EXCLUDED.cron_jobname;

INSERT INTO public.email_templates (
  slug, model_key, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt,
  is_active, variables, updated_at
)
VALUES (
  'rosiere_cfp_missing',
  'rosiere_cfp_missing',
  'La Rosière',
  'Attestation CFP — dossier FIF-PL La Rosière ({{inscription_code}})',
  '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Vous êtes inscrit·e à la formation de La Rosière ({{inscription_code}}). Pour constituer votre dossier FIF-PL et calculer le reste à charge de l'ESF, nous avons besoin des informations suivantes :</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 8px">votre <strong>attestation CFP URSSAF 2026</strong> (espace URSSAF → documents / attestations → attestation de contribution à la formation professionnelle) ;</li>
<li style="margin:0 0 8px">votre <strong>statut</strong> : indépendant (100&nbsp;% des critères) ou micro-entrepreneur (selon la cotisation CFP) ;</li>
<li style="margin:0 0 8px">le <strong>montant déjà pris en charge par le FIF-PL en 2026</strong> pour une autre formation, s'il y a lieu (indiquez 0&nbsp;€ sinon).</li>
</ul>
<p style="margin:0 0 16px">Merci de répondre à ce message avec ces éléments : ils arrivent directement à <a href="mailto:info@fli.fr" style="color:#111">info@fli.fr</a>.</p>
<p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p>
</td></tr>
</table>
</td></tr>
</table>$html$,
  '', '',
  true,
  '["student_name", "inscription_code"]'::jsonb,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  is_active = true,
  variables = EXCLUDED.variables,
  updated_at = now();

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
)
SELECT
  t.slug,
  t.model_key,
  1,
  COALESCE(t.variant_label, 'La Rosière'),
  t.subject_fr, '', '',
  t.body_fr, '', '',
  t.variables,
  'Envoi auto si moniteur La Rosière sans attestation CFP / statut / autre FIF-PL 2026.',
  now()
FROM public.email_templates t
WHERE t.slug = 'rosiere_cfp_missing'
ON CONFLICT (slug) DO UPDATE SET
  model_key = EXCLUDED.model_key,
  variant_label = EXCLUDED.variant_label,
  subject_fr = EXCLUDED.subject_fr,
  body_fr = EXCLUDED.body_fr,
  variables = EXCLUDED.variables,
  notes = EXCLUDED.notes,
  updated_at = now();

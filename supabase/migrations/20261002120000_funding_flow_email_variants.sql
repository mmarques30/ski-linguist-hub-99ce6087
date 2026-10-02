-- Flux par modalité de financement : modèles e-mail dossier (FIFPL / AGEFICE / Autofinancement)
-- + placeholder {{funding_next_steps}} sur les confirmations.
-- Déjà appliqué en live (2026-10-02) ; cette migration aligne les nouveaux environnements.

-- ---------------------------------------------------------------------------
-- 1. Confirmation : injecter {{funding_next_steps}} (texte calculé côté Edge)
-- ---------------------------------------------------------------------------
UPDATE public.email_templates
SET
  body_fr = regexp_replace(
    body_fr,
    '<p style="margin:0 0 16px">Prochaines étapes :[^<]*</p>',
    '<p style="margin:0 0 16px">{{funding_next_steps}}</p>'
  ),
  variables = CASE
    WHEN variables ? 'funding_next_steps' THEN variables
    ELSE COALESCE(variables, '[]'::jsonb) || '["funding_next_steps"]'::jsonb
  END,
  updated_at = now()
WHERE slug IN (
  'inscription_confirmation_individual',
  'inscription_confirmation_group'
)
AND body_fr LIKE '%Prochaines étapes:%'
AND body_fr NOT LIKE '%{{funding_next_steps}}%';

UPDATE public.email_template_drafts
SET
  body_fr = regexp_replace(
    body_fr,
    '<p style="margin:0 0 16px">Prochaines étapes :[^<]*</p>',
    '<p style="margin:0 0 16px">{{funding_next_steps}}</p>'
  ),
  variables = CASE
    WHEN variables ? 'funding_next_steps' THEN variables
    ELSE COALESCE(variables, '[]'::jsonb) || '["funding_next_steps"]'::jsonb
  END,
  updated_at = now()
WHERE slug IN (
  'inscription_confirmation_individual',
  'inscription_confirmation_group'
)
AND body_fr LIKE '%Prochaines étapes:%'
AND body_fr NOT LIKE '%{{funding_next_steps}}%';

-- ---------------------------------------------------------------------------
-- 2. Variantes dossier (modèle 2) — une par flux avec pack auto
-- ---------------------------------------------------------------------------
INSERT INTO public.email_templates (
  slug, model_key, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt,
  is_active, variables, updated_at
)
VALUES
(
  'inscription_documents_fifpl',
  'inscription_documents',
  'FIF-PL',
  'Votre dossier de formation {{language}} (FIF-PL) — {{inscription_code}}',
  '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55"><p style="margin:0 0 16px">Bonjour {{student_name}},</p><p style="margin:0 0 16px">Vous trouverez en pièces jointes votre dossier FIF-PL pour la formation {{language}} (inscription {{inscription_code}}) :</p><ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li><li style="margin:0 0 6px">Programme de la formation</li><li style="margin:0 0 6px">Critères de prise en charge FIF-PL</li><li style="margin:0 0 6px">Tutoriel pour la demande de prise en charge FIF-PL</li></ul><p style="margin:0 0 16px">Pensez à faire votre demande de prise en charge avant le début de la formation. Sans elle, le FIF-PL ne rembourse pas.</p><p style="margin:0 0 16px">Pour nous retourner la convention signée, répondez à ce message avec le document en pièce jointe : il arrive directement à info@fli.fr.</p><p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p></td></tr></table></td></tr></table>$html$,
  '', '',
  true,
  '["language", "inscription_code", "student_name"]'::jsonb,
  now()
),
(
  'inscription_documents_agefice',
  'inscription_documents',
  'AGEFICE',
  'Votre dossier de formation {{language}} (AGEFICE) — {{inscription_code}}',
  '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55"><p style="margin:0 0 16px">Bonjour {{student_name}},</p><p style="margin:0 0 16px">Vous trouverez en pièces jointes votre dossier AGEFICE pour la formation {{language}} (inscription {{inscription_code}}) :</p><ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li><li style="margin:0 0 6px">Programme de la formation</li><li style="margin:0 0 6px">Formulaire de demande de prise en charge AGEFICE — à compléter et signer</li><li style="margin:0 0 6px">Liste des pièces justificatives AGEFICE</li></ul><p style="margin:0 0 16px">Merci de nous retourner la convention et la demande AGEFICE remplies et signées pour que nous puissions déposer votre dossier. Consultez les plafonds 2026 : https://communication-agefice.fr/plafonds-financiers-annee-2026/</p><p style="margin:0 0 16px">Pour nous renvoyer les documents, répondez à ce message avec les fichiers en pièce jointe : ils arrivent à info@fli.fr.</p><p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p></td></tr></table></td></tr></table>$html$,
  '', '',
  true,
  '["language", "inscription_code", "student_name"]'::jsonb,
  now()
),
(
  'inscription_documents_self',
  'inscription_documents',
  'Autofinancement',
  'Votre dossier de formation {{language}} — {{inscription_code}}',
  '', '',
  $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55"><p style="margin:0 0 16px">Bonjour {{student_name}},</p><p style="margin:0 0 16px">Vous trouverez en pièces jointes les documents de votre formation {{language}} (inscription {{inscription_code}}) :</p><ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li><li style="margin:0 0 6px">Programme de la formation</li></ul><p style="margin:0 0 16px">Merci de nous renvoyer la convention signée en répondant à ce message (info@fli.fr).</p><p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p></td></tr></table></td></tr></table>$html$,
  '', '',
  true,
  '["language", "inscription_code", "student_name"]'::jsonb,
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

-- Neutraliser le fallback historique (plus de wording FIF-PL exclusif)
UPDATE public.email_templates
SET
  variant_label = 'Repli générique',
  body_fr = $html$
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px">Bonjour {{student_name}},</p>
<p style="margin:0 0 16px">Vous trouverez en pièces jointes le dossier de votre formation {{language}} (inscription {{inscription_code}}) :</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Convention de formation — à nous retourner signée</li>
<li style="margin:0 0 6px">Programme de la formation</li>
<li style="margin:0 0 6px">Formulaire de demande de prise en charge (selon votre organisme financeur)</li>
<li style="margin:0 0 6px">Documents d’accompagnement pour constituer le dossier</li>
</ul>
<p style="margin:0 0 16px">Merci de constituer votre dossier de prise en charge auprès de votre organisme <strong>avant le début de la formation</strong>. Sans accord de prise en charge, les frais ne sont en général pas remboursés.</p>
<p style="margin:0 0 16px">Pour nous retourner la convention (et le formulaire) signés, répondez à ce message avec les documents en pièce jointe : ils arrivent directement à info@fli.fr.</p>
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
</table>
$html$,
  updated_at = now()
WHERE slug = 'inscription_documents';

-- Brouillons alignés (pour /admin/emails)
INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes, updated_at
)
SELECT
  t.slug,
  'inscription_documents',
  CASE t.slug
    WHEN 'inscription_documents_fifpl' THEN 2
    WHEN 'inscription_documents_agefice' THEN 3
    WHEN 'inscription_documents_self' THEN 4
    ELSE 1
  END,
  COALESCE(t.variant_label, 'Variante'),
  t.subject_fr, '', '',
  t.body_fr, '', '',
  t.variables,
  CASE t.slug
    WHEN 'inscription_documents_fifpl' THEN 'Flux FIFPL — pack critères + tutoriel + convention + programme.'
    WHEN 'inscription_documents_agefice' THEN 'Flux AGEFICE — pack demande + pièces + convention + programme.'
    WHEN 'inscription_documents_self' THEN 'Flux Autofinancement — convention + programme uniquement.'
    ELSE 'Repli générique'
  END,
  now()
FROM public.email_templates t
WHERE t.slug IN (
  'inscription_documents_fifpl',
  'inscription_documents_agefice',
  'inscription_documents_self'
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

UPDATE public.email_templates
SET
  variables = '["language", "inscription_code", "student_name"]'::jsonb,
  updated_at = now()
WHERE slug IN (
  'inscription_documents_fifpl',
  'inscription_documents_agefice',
  'inscription_documents_self'
)
AND (variables IS NULL OR variables = '[]'::jsonb);

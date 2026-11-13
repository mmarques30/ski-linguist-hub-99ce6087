-- Dossier FIF-PL : préciser que la convention tient lieu de devis,
-- et que les formations FLI ne sont pas assujetties à la TVA (HT = TTC).

UPDATE public.email_templates
SET
  body_fr = $html$<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8"><tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55"><p style="margin:0 0 16px">Bonjour {{student_name}},</p><p style="margin:0 0 16px">Vous trouverez en pièces jointes votre dossier FIF-PL pour la formation {{language}} (inscription {{inscription_code}}) :</p><ul style="margin:0 0 16px;padding-left:20px"><li style="margin:0 0 6px">Convention de formation — à nous retourner signée. Ce document fait également office de devis : c'est celui à joindre à votre demande auprès du FIF-PL.</li><li style="margin:0 0 6px">Programme de la formation</li><li style="margin:0 0 6px">Critères de prise en charge FIF-PL</li><li style="margin:0 0 6px">Tutoriel pour la demande de prise en charge FIF-PL</li></ul><p style="margin:0 0 16px">Nos formations ne sont pas assujetties à la TVA : lors de votre demande auprès du FIF-PL, indiquez le même montant en HT et en TTC.</p><p style="margin:0 0 16px">Pensez à faire votre demande de prise en charge avant le début de la formation. Sans elle, le FIF-PL ne rembourse pas.</p><p style="margin:0 0 16px">Pour nous retourner la convention signée, répondez à ce message avec le document en pièce jointe : il arrive directement à info@fli.fr.</p><p style="margin:24px 0 0">Cordialement,<br/>L'équipe FLI</p></td></tr></table></td></tr></table>$html$,
  updated_at = now()
WHERE slug = 'inscription_documents_fifpl';

UPDATE public.email_template_drafts
SET
  body_fr = (SELECT body_fr FROM public.email_templates WHERE slug = 'inscription_documents_fifpl'),
  notes = 'Flux FIFPL — pack critères + tutoriel + convention (= devis) + programme. Précise HT = TTC (pas de TVA).',
  updated_at = now()
WHERE slug = 'inscription_documents_fifpl';

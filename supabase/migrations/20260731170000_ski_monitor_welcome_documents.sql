-- Email template for ski instructor online registration welcome pack
INSERT INTO public.email_templates (slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables)
SELECT
  'inscription_ski_monitor_welcome',
  'Vos documents d''inscription FLI — Formation en ligne',
  'Your FLI registration documents — Online training',
  'Seus documentos de inscrição FLI — Formação online',
  '<h2>Bonjour {{student_name}},</h2>
<p>Merci pour votre inscription à la formation <strong>{{language}}</strong> (code : <strong>{{inscription_code}}</strong>).</p>
<p>En tant que moniteur de ski inscrit à une formation <strong>en ligne</strong>, vous trouverez ci-joint les documents suivants :</p>
<ul>
  <li>Critères de prise en charge Moniteurs de ski 2026 (PDF)</li>
  <li>Convention de formation 2025</li>
  <li>Programme détaillé 2025</li>
</ul>
<p>Merci de les conserver pour vos démarches de financement (FIFPL / OPCO).</p>
<p>Cordialement,<br/>L''équipe France Langues International</p>',
  '<h2>Hello {{student_name}},</h2>
<p>Thank you for registering for <strong>{{language}}</strong> training (code: <strong>{{inscription_code}}</strong>).</p>
<p>As a ski instructor enrolled in an <strong>online</strong> course, please find the attached documents.</p>
<p>Best regards,<br/>France Langues International</p>',
  '<h2>Olá {{student_name}},</h2>
<p>Obrigado pela sua inscrição na formação de <strong>{{language}}</strong> (código: <strong>{{inscription_code}}</strong>).</p>
<p>Como monitor de esqui inscrito num curso <strong>online</strong>, seguem em anexo os documentos necessários.</p>
<p>Atenciosamente,<br/>France Langues International</p>',
  '["student_name","language","inscription_code"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates WHERE slug = 'inscription_ski_monitor_welcome'
);

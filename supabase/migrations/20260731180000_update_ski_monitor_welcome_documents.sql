-- Update ski monitor welcome email template for Station 2022 documents (all modalities)
UPDATE public.email_templates
SET
  subject_fr = 'Vos documents d''inscription FLI — Moniteur de ski',
  subject_en = 'Your FLI registration documents — Ski instructor',
  subject_pt = 'Seus documentos de inscrição FLI — Monitor de esqui',
  body_fr = '<h2>Bonjour {{student_name}},</h2>
<p>Merci pour votre inscription à la formation <strong>{{language}}</strong> (code : <strong>{{inscription_code}}</strong>).</p>
<p>En tant que moniteur de ski, vous trouverez ci-joint les documents suivants :</p>
<ul>
  <li>Critères de prise en charge Moniteurs de ski 2026 (PDF)</li>
  <li>Convention Stage langues Station 2022</li>
  <li>Contenu pédagogique Station 2022</li>
</ul>
<p>Merci de les conserver pour vos démarches de financement (FIFPL / OPCO).</p>
<p>Cordialement,<br/>L''équipe France Langues International</p>',
  body_en = '<h2>Hello {{student_name}},</h2>
<p>Thank you for registering for <strong>{{language}}</strong> training (code: <strong>{{inscription_code}}</strong>).</p>
<p>As a ski instructor, please find the attached documents:</p>
<ul>
  <li>Ski instructor coverage criteria 2026 (PDF)</li>
  <li>Station 2022 language training agreement</li>
  <li>Station 2022 pedagogical content</li>
</ul>
<p>Best regards,<br/>France Langues International</p>',
  body_pt = '<h2>Olá {{student_name}},</h2>
<p>Obrigado pela sua inscrição na formação de <strong>{{language}}</strong> (código: <strong>{{inscription_code}}</strong>).</p>
<p>Como monitor de esqui, seguem em anexo os documentos necessários:</p>
<ul>
  <li>Critérios de cobertura para monitores de esqui 2026 (PDF)</li>
  <li>Convenção de estágio de línguas Station 2022</li>
  <li>Conteúdo pedagógico Station 2022</li>
</ul>
<p>Atenciosamente,<br/>France Langues International</p>'
WHERE slug = 'inscription_ski_monitor_welcome';

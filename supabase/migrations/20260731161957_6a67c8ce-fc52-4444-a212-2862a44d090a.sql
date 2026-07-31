UPDATE public.email_templates SET
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
<p>As a ski instructor, please find attached the 2026 funding criteria, the 2022 station language course agreement and the 2022 teaching content.</p>
<p>Best regards,<br/>France Langues International</p>',
  body_pt = '<h2>Olá {{student_name}},</h2>
<p>Obrigado pela sua inscrição na formação de <strong>{{language}}</strong> (código: <strong>{{inscription_code}}</strong>).</p>
<p>Como monitor de esqui, seguem em anexo os critérios de financiamento 2026, a convenção de estágio 2022 e o conteúdo pedagógico 2022.</p>
<p>Atenciosamente,<br/>France Langues International</p>',
  updated_at = now()
WHERE slug = 'inscription_ski_monitor_welcome';
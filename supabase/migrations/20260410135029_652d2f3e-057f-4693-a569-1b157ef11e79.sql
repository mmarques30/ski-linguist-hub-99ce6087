
-- Email templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  subject_fr text NOT NULL DEFAULT '',
  subject_en text NOT NULL DEFAULT '',
  subject_pt text NOT NULL DEFAULT '',
  body_fr text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_pt text NOT NULL DEFAULT '',
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email_templates" ON public.email_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert email_templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin can update email_templates" ON public.email_templates FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin can delete email_templates" ON public.email_templates FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email log table
CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_slug text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'envoye',
  error_message text,
  variables_used jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email_log" ON public.email_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert email_log" ON public.email_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can delete email_log" ON public.email_log FOR DELETE TO authenticated USING (is_admin());

-- Seed default templates
INSERT INTO public.email_templates (slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables) VALUES
('inscription_confirmation',
 'Confirmation de votre inscription FLI',
 'FLI Registration Confirmation',
 'Confirmação de inscrição FLI',
 '<h2>Bonjour {{student_name}},</h2><p>Votre inscription pour la formation <strong>{{language}}</strong> du {{start_date}} au {{end_date}} est confirmée.</p><p>Code inscription : {{inscription_code}}</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>Your registration for <strong>{{language}}</strong> training from {{start_date}} to {{end_date}} is confirmed.</p><p>Registration code: {{inscription_code}}</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Sua inscrição para o treinamento de <strong>{{language}}</strong> de {{start_date}} a {{end_date}} está confirmada.</p><p>Código de inscrição: {{inscription_code}}</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language","start_date","end_date","inscription_code"]'::jsonb),

('payment_reminder',
 'Rappel de paiement - Formation FLI',
 'Payment Reminder - FLI Training',
 'Lembrete de pagamento - Formação FLI',
 '<h2>Bonjour {{student_name}},</h2><p>Nous vous rappelons que le paiement de <strong>{{amount_due}} €</strong> pour votre formation {{language}} débutant le {{start_date}} n''a pas encore été reçu.</p><p>Merci de procéder au règlement dans les meilleurs délais.</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>This is a reminder that payment of <strong>€{{amount_due}}</strong> for your {{language}} training starting {{start_date}} has not been received.</p><p>Please arrange payment at your earliest convenience.</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Lembramos que o pagamento de <strong>€{{amount_due}}</strong> para seu treinamento de {{language}} começando em {{start_date}} ainda não foi recebido.</p><p>Por favor, providencie o pagamento o mais breve possível.</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language","start_date","amount_due"]'::jsonb),

('test_reminder',
 'Complétez votre test de niveau',
 'Complete Your Placement Test',
 'Complete seu teste de nível',
 '<h2>Bonjour {{student_name}},</h2><p>Votre formation {{language}} débute le {{start_date}}. Nous vous invitons à compléter votre test de niveau en ligne avant cette date.</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>Your {{language}} training starts on {{start_date}}. Please complete your online placement test before that date.</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Seu treinamento de {{language}} começa em {{start_date}}. Por favor, complete seu teste de nível online antes dessa data.</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language","start_date"]'::jsonb),

('session_reminder',
 'Votre prochaine session de formation',
 'Your Upcoming Training Session',
 'Sua próxima sessão de treinamento',
 '<h2>Bonjour {{student_name}},</h2><p>Rappel : votre prochaine session de {{language}} est prévue le <strong>{{session_date}}</strong> de {{start_time}} à {{end_time}}.</p><p>Lieu : {{location}}</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>Reminder: your next {{language}} session is scheduled for <strong>{{session_date}}</strong> from {{start_time}} to {{end_time}}.</p><p>Location: {{location}}</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Lembrete: sua próxima sessão de {{language}} está agendada para <strong>{{session_date}}</strong> das {{start_time}} às {{end_time}}.</p><p>Local: {{location}}</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language","session_date","start_time","end_time","location"]'::jsonb),

('evaluation_request',
 'Donnez votre avis sur votre formation',
 'Share Your Training Feedback',
 'Dê sua opinião sobre seu treinamento',
 '<h2>Bonjour {{student_name}},</h2><p>Votre formation {{language}} est terminée. Nous serions ravis de recueillir votre avis.</p><p>Merci de remplir notre enquête de satisfaction.</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>Your {{language}} training has ended. We would love to hear your feedback.</p><p>Please fill out our satisfaction survey.</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Seu treinamento de {{language}} terminou. Gostaríamos de ouvir sua opinião.</p><p>Por favor, preencha nossa pesquisa de satisfação.</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language"]'::jsonb),

('certificate_available',
 'Votre certificat est disponible',
 'Your Certificate Is Available',
 'Seu certificado está disponível',
 '<h2>Bonjour {{student_name}},</h2><p>Votre certificat de formation {{language}} (niveau {{level}}) est maintenant disponible dans votre espace stagiaire.</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>Your {{language}} training certificate (level {{level}}) is now available in your student portal.</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Seu certificado de treinamento de {{language}} (nível {{level}}) está disponível em seu portal do aluno.</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","language","level"]'::jsonb),

('invoice_overdue',
 'Facture en retard - Relance',
 'Overdue Invoice - Reminder',
 'Fatura atrasada - Lembrete',
 '<h2>Bonjour {{student_name}},</h2><p>Nous constatons que la facture <strong>{{invoice_number}}</strong> d''un montant de <strong>{{amount_due}} €</strong> (échéance : {{due_date}}) reste impayée.</p><p>Merci de régulariser votre situation dans les plus brefs délais.</p><p>Cordialement,<br/>L''équipe FLI</p>',
 '<h2>Hello {{student_name}},</h2><p>We notice that invoice <strong>{{invoice_number}}</strong> for <strong>€{{amount_due}}</strong> (due: {{due_date}}) remains unpaid.</p><p>Please settle this at your earliest convenience.</p><p>Best regards,<br/>The FLI Team</p>',
 '<h2>Olá {{student_name}},</h2><p>Verificamos que a fatura <strong>{{invoice_number}}</strong> no valor de <strong>€{{amount_due}}</strong> (vencimento: {{due_date}}) permanece em aberto.</p><p>Por favor, regularize sua situação o mais breve possível.</p><p>Atenciosamente,<br/>Equipe FLI</p>',
 '["student_name","invoice_number","amount_due","due_date"]'::jsonb);

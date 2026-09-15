-- Point 8 complet — brouillons des six modèles
--
-- Ces textes sont des propositions : ils sont écrits dans
-- public.email_template_drafts, jamais dans public.email_templates.
-- Rien ne part tant que Paula n'a pas cliqué « Valider et activer »
-- sur /admin/emails (RPC publish_email_template_draft, journalisée).
--
-- Les deux modèles déjà relus au point 8-minimal gardent leur texte live ;
-- le brouillon de la confirmation ajoute les quatre lignes demandées
-- (lieu, modalité, piste, paiement) et attend donc une relecture.

-- ---------------------------------------------------------------------------
-- 1. Confirmation d'inscription (enrichie : lieu, modalité, piste, paiement)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
) VALUES (
  'inscription_confirmation', 'inscription_confirmation', 1, 'Texte unique',
  'Confirmation de votre inscription — France Langues International',
  'Your registration is confirmed — France Langues International',
  'Confirmação da sua inscrição — France Langues International',
  $html$<p>Bonjour {{student_name}},</p>
<p>Nous vous confirmons votre inscription à la formation <strong>{{language}}</strong>, du {{start_date}} au {{end_date}}.</p>
<p>Votre code d'inscription : <strong>{{inscription_code}}</strong></p>
<table role="presentation" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:16px 0">
  <tr><td style="color:#555">Lieu</td><td><strong>{{course_location}}</strong></td></tr>
  <tr><td style="color:#555">Modalité</td><td><strong>{{modality_label}}</strong></td></tr>
  <tr><td style="color:#555">Piste atteinte au test</td><td><strong>{{slope_label}}</strong></td></tr>
  <tr><td style="color:#555">Paiement</td><td><strong>{{payment_label}}</strong></td></tr>
</table>
<p>Nous reviendrons vers vous pour la suite du parcours : horaires du matin ou de l'après-midi, formateur·rice, puis accès à votre espace stagiaire.</p>
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
<p>Your registration for the <strong>{{language}}</strong> course is confirmed, from {{start_date}} to {{end_date}}.</p>
<p>Your registration code: <strong>{{inscription_code}}</strong></p>
<table role="presentation" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:16px 0">
  <tr><td style="color:#555">Location</td><td><strong>{{course_location}}</strong></td></tr>
  <tr><td style="color:#555">Format</td><td><strong>{{modality_label}}</strong></td></tr>
  <tr><td style="color:#555">Slope reached in the test</td><td><strong>{{slope_label}}</strong></td></tr>
  <tr><td style="color:#555">Payment</td><td><strong>{{payment_label}}</strong></td></tr>
</table>
<p>We will come back to you with the next steps: morning or afternoon group, trainer, then access to your student portal.</p>
<p>If you have any question, simply reply to this message: it reaches info@fli.fr.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>Confirmamos a sua inscrição na formação <strong>{{language}}</strong>, de {{start_date}} a {{end_date}}.</p>
<p>O seu código de inscrição: <strong>{{inscription_code}}</strong></p>
<table role="presentation" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin:16px 0">
  <tr><td style="color:#555">Local</td><td><strong>{{course_location}}</strong></td></tr>
  <tr><td style="color:#555">Modalidade</td><td><strong>{{modality_label}}</strong></td></tr>
  <tr><td style="color:#555">Pista atingida no teste</td><td><strong>{{slope_label}}</strong></td></tr>
  <tr><td style="color:#555">Pagamento</td><td><strong>{{payment_label}}</strong></td></tr>
</table>
<p>Voltaremos a contactá-lo para as etapas seguintes: horário de manhã ou de tarde, formador·a e acesso ao seu espaço de formando.</p>
<p>Para qualquer questão, responda a esta mensagem: chegará a info@fli.fr.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["student_name","language","start_date","end_date","inscription_code","course_location","modality_label","slope_label","payment_label"]'::jsonb,
  'Enrichi par rapport au texte actif : quatre lignes ajoutées (lieu, modalité, piste, paiement). La piste remplace le code CECRL côté stagiaire (règle du point 4). Le texte actif reste celui du point 8-minimal jusqu''à votre validation.'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Documents d'inscription — moniteur de ski
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
) VALUES (
  'inscription_ski_monitor_welcome', 'inscription_ski_monitor_welcome', 1, 'Texte unique',
  'Vos documents d''inscription — France Langues International',
  'Your registration documents — France Langues International',
  'Os seus documentos de inscrição — France Langues International',
  $html$<p>Bonjour {{student_name}},</p>
<p>Votre inscription à la formation <strong>{{language}}</strong> est enregistrée sous le code <strong>{{inscription_code}}</strong>.</p>
<p>Vous trouverez en pièces jointes les documents à conserver : livret d'accueil, règlement intérieur, programme de formation et conditions générales.</p>
<p>Aucune démarche n'est attendue de votre part à ce stade. Nous vous écrirons pour les horaires et l'accès à votre espace stagiaire.</p>
<p>Si un document manque ou vous semble illisible, répondez à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{student_name}},</p>
<p>Your registration for the <strong>{{language}}</strong> course is recorded under code <strong>{{inscription_code}}</strong>.</p>
<p>Attached are the documents to keep: welcome booklet, internal rules, training programme and terms and conditions.</p>
<p>Nothing is expected from you at this stage. We will write again about schedules and your student portal access.</p>
<p>If a document is missing or unreadable, simply reply to this message: it reaches info@fli.fr.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>A sua inscrição na formação <strong>{{language}}</strong> está registada com o código <strong>{{inscription_code}}</strong>.</p>
<p>Em anexo encontra os documentos a guardar: manual de acolhimento, regulamento interno, programa de formação e condições gerais.</p>
<p>Nesta fase não é necessária qualquer ação da sua parte. Voltaremos a escrever sobre os horários e o acesso ao seu espaço de formando.</p>
<p>Se faltar algum documento ou estiver ilegível, responda a esta mensagem: chegará a info@fli.fr.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["student_name","language","inscription_code"]'::jsonb,
  'Le texte actif date de juillet et cite « FLI Formation ». Ce brouillon reprend l''identité et le pied de page du point 8-minimal.'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Accès à l'espace stagiaire (brouillon = texte validé au 8-minimal)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
)
SELECT
  t.slug, 'student_portal_invite', 1, 'Texte unique',
  t.subject_fr, t.subject_en, t.subject_pt,
  t.body_fr, t.body_en, t.body_pt, t.variables,
  'Identique au texte actif (validé au point 8-minimal). Aucune relecture nécessaire.'
FROM public.email_templates t
WHERE t.slug = 'student_portal_invite'
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Validation des horaires J-10 (interne)
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
) VALUES (
  'schedule_validation_reminder', 'schedule_validation_reminder', 1, 'Texte unique',
  'FLI — Validation des horaires (J-10) — {{total_count}} inscription(s)',
  'FLI — Schedule validation (J-10) — {{total_count}} enrollment(s)',
  'FLI — Validação dos horários (J-10) — {{total_count}} inscrição(ões)',
  $html$<p>Bonjour,</p>
<p>Des inscriptions débutent dans <strong>10 jours</strong> ({{start_date}}) et attendent la répartition matin / après-midi.</p>
{{groups_html}}
<p><a href="{{dashboard_url}}">Ouvrir les horaires J-10</a></p>
<p style="color:#555;font-size:13px">Message interne FLI — aucun stagiaire n'est en copie.</p>$html$,
  $html$<p>Hello,</p>
<p>Enrollments start in <strong>10 days</strong> ({{start_date}}) and still need the morning / afternoon split.</p>
{{groups_html}}
<p><a href="{{dashboard_url}}">Open the J-10 schedule</a></p>
<p style="color:#555;font-size:13px">Internal FLI message — no trainee is copied.</p>$html$,
  $html$<p>Olá,</p>
<p>Há inscrições que começam dentro de <strong>10 dias</strong> ({{start_date}}) e aguardam a distribuição manhã / tarde.</p>
{{groups_html}}
<p><a href="{{dashboard_url}}">Abrir os horários J-10</a></p>
<p style="color:#555;font-size:13px">Mensagem interna FLI — nenhum formando está em cópia.</p>$html$,
  '["start_date","total_count","groups_html","dashboard_url"]'::jsonb,
  'Destinataire interne (info@fli.fr). Le cron process-schedule-reminders reste inactif jusqu''à votre accord.'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Relance de paiement — trois niveaux
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
) VALUES (
  'invoice_reminder_1', 'invoice_reminder', 1, 'Premier rappel (J+7)',
  'Rappel — facture {{invoice_number}} échue',
  'Reminder — invoice {{invoice_number}} past due',
  'Lembrete — fatura {{invoice_number}} vencida',
  $html$<p>Bonjour {{client_name}},</p>
<p>Sauf erreur de notre part, la facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{amount}}</strong>, échue le {{due_date}}, n'a pas encore été réglée.</p>
<p>Nous vous remercions de bien vouloir procéder au règlement, ou de nous indiquer la date prévue.</p>
<p>Si le paiement est déjà parti, ne tenez pas compte de ce message : nos règlements se croisent parfois.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{client_name}},</p>
<p>Unless we are mistaken, invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong>, due on {{due_date}}, has not been paid yet.</p>
<p>Please proceed with the payment, or let us know the date you have planned.</p>
<p>If the payment has already been sent, please disregard this message.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{client_name}},</p>
<p>Salvo erro nosso, a fatura <strong>{{invoice_number}}</strong>, no valor de <strong>{{amount}}</strong>, vencida a {{due_date}}, ainda não foi paga.</p>
<p>Agradecemos que proceda ao pagamento ou que nos indique a data prevista.</p>
<p>Se o pagamento já foi enviado, ignore esta mensagem.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["client_name","invoice_number","amount","due_date","days_overdue"]'::jsonb,
  'Ton neutre : la facture peut être adressée à une ESF comme à un stagiaire.'
),
(
  'invoice_reminder_2', 'invoice_reminder', 2, 'Second rappel (J+15)',
  'Second rappel — facture {{invoice_number}} échue depuis {{days_overdue}} jours',
  'Second reminder — invoice {{invoice_number}}, {{days_overdue}} days past due',
  'Segundo lembrete — fatura {{invoice_number}}, {{days_overdue}} dias de atraso',
  $html$<p>Bonjour {{client_name}},</p>
<p>Malgré notre premier rappel, la facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{amount}}</strong>, échue le {{due_date}}, reste impayée ({{days_overdue}} jours de retard).</p>
<p>Nous vous remercions de régulariser cette facture, ou de nous appeler au 04 79 28 21 09 si un échelonnement vous aide : nous trouverons une solution.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{client_name}},</p>
<p>Despite our first reminder, invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong>, due on {{due_date}}, is still unpaid ({{days_overdue}} days past due).</p>
<p>Please settle this invoice, or call us on +33 4 79 28 21 09 if a payment plan would help: we will find a solution.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{client_name}},</p>
<p>Apesar do nosso primeiro lembrete, a fatura <strong>{{invoice_number}}</strong>, no valor de <strong>{{amount}}</strong>, vencida a {{due_date}}, continua em dívida ({{days_overdue}} dias de atraso).</p>
<p>Agradecemos a regularização ou um telefonema para +33 4 79 28 21 09 caso um plano de pagamento ajude: encontraremos uma solução.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["client_name","invoice_number","amount","due_date","days_overdue"]'::jsonb,
  'Le texte actuellement codé en dur menace d''un recouvrement dès le second rappel : ce brouillon réserve cette mention au niveau 3.'
),
(
  'invoice_reminder_3', 'invoice_reminder', 3, 'Mise en demeure (J+30)',
  'Mise en demeure — facture {{invoice_number}}',
  'Formal notice — invoice {{invoice_number}}',
  'Interpelação — fatura {{invoice_number}}',
  $html$<p>Bonjour {{client_name}},</p>
<p>Nos rappels des jours précédents sont restés sans réponse. La facture <strong>{{invoice_number}}</strong> d'un montant de <strong>{{amount}}</strong>, échue le {{due_date}}, présente {{days_overdue}} jours de retard.</p>
<p>La présente lettre vaut <strong>mise en demeure de payer</strong>. À défaut de règlement dans un délai de huit jours à compter de la réception de ce message, le dossier sera transmis au recouvrement et des intérêts de retard seront appliqués conformément à nos conditions générales.</p>
<p>Pour régler ou nous signaler une difficulté : 04 79 28 21 09 ou info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{client_name}},</p>
<p>Our previous reminders have remained unanswered. Invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong>, due on {{due_date}}, is {{days_overdue}} days past due.</p>
<p>This message constitutes a <strong>formal notice to pay</strong>. Without payment within eight days of receiving it, the file will be passed to debt collection and late-payment interest will apply in line with our terms and conditions.</p>
<p>To pay or report a difficulty: +33 4 79 28 21 09 or info@fli.fr.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{client_name}},</p>
<p>Os nossos lembretes anteriores ficaram sem resposta. A fatura <strong>{{invoice_number}}</strong>, no valor de <strong>{{amount}}</strong>, vencida a {{due_date}}, tem {{days_overdue}} dias de atraso.</p>
<p>Esta mensagem vale como <strong>interpelação para pagamento</strong>. Sem pagamento no prazo de oito dias após a sua receção, o processo será encaminhado para cobrança e serão aplicados juros de mora nos termos das nossas condições gerais.</p>
<p>Para pagar ou indicar uma dificuldade: +33 4 79 28 21 09 ou info@fli.fr.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["client_name","invoice_number","amount","due_date","days_overdue"]'::jsonb,
  'Mention légale à relire : délai de huit jours et intérêts de retard renvoient aux conditions générales FLI.'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Questionnaire de satisfaction — deux niveaux
-- ---------------------------------------------------------------------------

INSERT INTO public.email_template_drafts (
  slug, model_key, position, variant_label,
  subject_fr, subject_en, subject_pt,
  body_fr, body_en, body_pt, variables, notes
) VALUES (
  'satisfaction_survey_reminder_1', 'satisfaction_survey_reminder', 1, 'Premier rappel (J+5)',
  'Votre avis sur la formation {{language}} — 2 minutes',
  'Your feedback on the {{language}} course — 2 minutes',
  'A sua opinião sobre a formação {{language}} — 2 minutos',
  $html$<p>Bonjour {{student_name}},</p>
<p>Votre formation <strong>{{language}}</strong> s'est terminée le {{end_date}}. Nous n'avons pas encore reçu votre questionnaire de satisfaction.</p>
<p>Il compte pour nous : c'est la seule mesure dont nous disposons pour ajuster les contenus, le rythme et la répartition des groupes. Il prend deux minutes.</p>
<p><a href="{{survey_link}}">Donner mon avis</a></p>
<p>Vos réponses sont utilisées de façon agrégée dans notre suivi qualité (Qualiopi).</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{student_name}},</p>
<p>Your <strong>{{language}}</strong> course ended on {{end_date}}. We have not received your satisfaction questionnaire yet.</p>
<p>It matters to us: it is the only measure we have to adjust content, pace and group allocation. It takes two minutes.</p>
<p><a href="{{survey_link}}">Give my feedback</a></p>
<p>Your answers are used in aggregate form for our quality monitoring (Qualiopi).</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>A sua formação <strong>{{language}}</strong> terminou a {{end_date}}. Ainda não recebemos o seu questionário de satisfação.</p>
<p>É importante para nós: é a única medida de que dispomos para ajustar conteúdos, ritmo e distribuição dos grupos. Leva dois minutos.</p>
<p><a href="{{survey_link}}">Dar a minha opinião</a></p>
<p>As suas respostas são utilizadas de forma agregada no nosso acompanhamento da qualidade (Qualiopi).</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["student_name","language","end_date","survey_link"]'::jsonb,
  'Le lien est nominatif et à usage unique (jeton du questionnaire).'
),
(
  'satisfaction_survey_reminder_2', 'satisfaction_survey_reminder', 2, 'Dernier rappel (J+30)',
  'Dernier rappel — votre avis sur la formation {{language}}',
  'Last reminder — your feedback on the {{language}} course',
  'Último lembrete — a sua opinião sobre a formação {{language}}',
  $html$<p>Bonjour {{student_name}},</p>
<p>Dernier rappel au sujet du questionnaire de satisfaction de votre formation <strong>{{language}}</strong> (terminée le {{end_date}}). Après ce message, nous ne vous relancerons plus.</p>
<p><a href="{{survey_link}}">Donner mon avis</a></p>
<p>Si vous préférez nous répondre en quelques mots, répondez simplement à ce message : il arrivera à info@fli.fr.</p>
<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Hello {{student_name}},</p>
<p>Last reminder about the satisfaction questionnaire for your <strong>{{language}}</strong> course (ended on {{end_date}}). After this message we will not write again.</p>
<p><a href="{{survey_link}}">Give my feedback</a></p>
<p>If you would rather answer in a few words, simply reply to this message: it reaches info@fli.fr.</p>
<p style="margin-top:24px">Kind regards,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  $html$<p>Olá {{student_name}},</p>
<p>Último lembrete sobre o questionário de satisfação da sua formação <strong>{{language}}</strong> (terminada a {{end_date}}). Depois desta mensagem não voltaremos a insistir.</p>
<p><a href="{{survey_link}}">Dar a minha opinião</a></p>
<p>Se preferir responder em poucas palavras, basta responder a esta mensagem: chegará a info@fli.fr.</p>
<p style="margin-top:24px">Com os melhores cumprimentos,</p>
<p>
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tel.: +33 4 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>$html$,
  '["student_name","language","end_date","survey_link"]'::jsonb,
  'Deuxième et dernière relance : la fonction Edge ne relance plus après ce message.'
)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Journal (aucune donnée personnelle)
-- ---------------------------------------------------------------------------

INSERT INTO public.audit_log (action, table_name, new_values)
SELECT
  'emails_8_complet_brouillons',
  'email_template_drafts',
  jsonb_build_object(
    'migration', '20260915101000_emails_8_complet_brouillons',
    'brouillons', (SELECT count(*) FROM public.email_template_drafts),
    'modeles', (SELECT count(DISTINCT model_key) FROM public.email_template_drafts),
    'actifs_inchanges', (SELECT count(*) FROM public.email_templates WHERE is_active)
  );

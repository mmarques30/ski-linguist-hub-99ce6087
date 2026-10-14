-- chloe-merloz / Chloé Merloz

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'e830229a-ddc6-43f7-a879-cddcd5e5c46d',
  'Chloé Merloz',
  'chloe-merloz@fli.placeholder.local',
  NULL,
  'moniteur',
  NULL,
  'a33b266c-230c-41a3-b2e4-796b2d59701f',
  '53902',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '7bc92b86-c7c6-4c82-bf41-a7316e17bca6',
  'e830229a-ddc6-43f7-a879-cddcd5e5c46d',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T14:00:00+00',
  'completed',
  'pending',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  'b475774d-e0c4-4651-9f7f-0be03c560de8'
);

INSERT INTO public.test_evaluations (
  id, booking_id, scoring_system,
  score_comprehension, score_expression, score_structure,
  score_technique, score_conversation, score_general,
  cecrl_label,
  bloc_introduction, bloc_comprehension, bloc_technique, bloc_conclusion,
  note_methodologique,
  status, verified_at
) VALUES (
  'd4e018de-4571-4309-9498-b753385c6cc7',
  '7bc92b86-c7c6-4c82-bf41-a7316e17bca6',
  'sur_5',
  3, 2, 2, 2, 2, 2,
  'B1',
  'Vous vous exprimez d''une façon assez claire et autonome.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Utilisez le PRESENT SIMPLE pour les vérités permanentes, la routine et les règles de sécurité. Apprenez PRETERIT et PRESENT PERFECT.',
  'Vous pouvez communiquer et donner des consignes en anglais mais pouvez améliorer votre conversation générale en revoyant les temps cités.',
  NULL,
  'valide',
  now()
);

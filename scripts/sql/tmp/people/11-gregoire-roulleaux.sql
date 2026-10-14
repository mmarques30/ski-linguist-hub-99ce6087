-- gregoire-roulleaux / Grégoire Roulleaux

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '95e6cefa-aba3-4cf1-ac38-5ae0abbc0b20',
  'Grégoire Roulleaux',
  'roulleauxgregoire@gmail.com',
  '+33678868001',
  'moniteur',
  NULL,
  '2191ccc4-244f-43c6-8073-6341ed472950',
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'b2e462c4-333f-4116-a464-2704f6a6df60',
  '95e6cefa-aba3-4cf1-ac38-5ae0abbc0b20',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T18:00:00+00',
  'completed',
  'pending',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  '65445a12-68a4-4eb2-9dc4-184834a92b6a'
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
  'f0ad3680-bff5-4dbc-9c04-4514688a4215',
  'b2e462c4-333f-4116-a464-2704f6a6df60',
  'sur_5',
  3, 1.5, 1.5, 1.5, 1.5, 1.5,
  'A2+',
  'Vous arrivez à interagir mais l''ensemble manque de fluidité et de justesse.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Prononciation : « ze » pour THE ; vous oubliez d''expirer le H. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Vous connaissez le vocabulaire mais les explications ne sont pas toujours claires. Vocabulaire : entreprise = company. Utilisez PRESENT -ing et PRESENT SIMPLE selon le contexte. Apprenez PRETERIT et PRESENT PERFECT. « Dans le but de » = TO (ex. : To get better at skiing, you need to...).',
  'Vous arrivez à vous faire comprendre mais votre accent gène par moments ; vous utilisez parfois le passé et parfois pas — à revoir.',
  NULL,
  'valide',
  now()
);

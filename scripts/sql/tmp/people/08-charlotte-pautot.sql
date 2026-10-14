-- charlotte-pautot / Charlotte Pautot

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '2151a7ca-2119-4c76-a784-3dcc3b25ab5f',
  'Charlotte Pautot',
  'charlottepautot@gmail.com',
  '+33635494173',
  'moniteur',
  NULL,
  'a2f27820-592b-4064-ac8c-fbb40e114222',
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '222b5f1b-c058-4538-a0cf-42ee2e6082ef',
  '2151a7ca-2119-4c76-a784-3dcc3b25ab5f',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T10:30:00+00',
  'completed',
  'bank_transfer',
  true,
  'A1/A2',
  'import_mollard_oct_2026',
  'esf',
  'c6978ead-813b-4646-bf23-01f7877af4d0'
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
  'e6b8ba5f-5008-41ff-9d02-f31c0a990cf8',
  '222b5f1b-c058-4538-a0cf-42ee2e6082ef',
  'sur_5',
  1, 1.5, 1.5, 1.5, 1.5, 1.5,
  'A2+',
  'Votre prononciation et votre accent sont corrects dans l''ensemble, mais il semble que vous manquez de pratique.',
  'Votre compréhension du texte audio était trop juste et incomplète. Vous oubliez d''expirer le H ce qui nuit parfois à une bonne compréhension. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Vocabulaire : talon = heel. Utilisez le PRESENT -ing et le PRESENT SIMPLE selon le contexte. Apprenez PRETERIT et PRESENT PERFECT. Revoyez MUST/HAVE TO et CAN/TO BE ABLE TO.',
  'Votre niveau vous permet de comprendre globalement et de vous exprimer en général.',
  NULL,
  'valide',
  now()
);

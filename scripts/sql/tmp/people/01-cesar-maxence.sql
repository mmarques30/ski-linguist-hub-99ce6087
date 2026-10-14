-- cesar-maxence / Maxence Cesar

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'a820224d-3d74-4d2e-a361-dd836f32b337',
  'Maxence Cesar',
  'maxence-cesar@fli.placeholder.local',
  NULL,
  'moniteur',
  NULL,
  '477839c1-e645-4f92-9bac-6ff7fac08c49',
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '257e9ea9-81d9-454b-bc16-82f7c27b9411',
  'a820224d-3d74-4d2e-a361-dd836f32b337',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-05T12:00:00+00',
  'completed',
  'pending',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  'd6753f10-9cea-43cb-a8d2-f5986650feb5'
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
  '0c8f12f2-fd55-4e50-b712-1ad62a5ed178',
  '257e9ea9-81d9-454b-bc16-82f7c27b9411',
  'sur_5',
  1, 1, 1, 1, 1, 1,
  'A2',
  'Vous avez envie de vous exprimer mais vous êtes gêné(e) par des erreurs syntaxiques (construction de phrases), grammaticales et lexicales.',
  'Votre compréhension du texte audio était trop juste et incomplète. Sur le plan grammatical, vous avez besoin de travailler encore les bases pour utiliser de manière plus spontanée et avec plus de justesse les différents temps et des structures plus justes, il faut automatiser certaines structures pour améliorer le débit et la fluidité.',
  'En ce qui concerne la partie spécifique à votre métier, il faut absolument que vous sachiez les termes techniques et les expressions car vous en avez besoin pour communiquer avec la clientèle anglophone. Vocabulaire : « station » = la gare ; la station de ski = « ski resort » ; obligatoire = mandatory. Utilisez le PRESENT -ing pour parler de ce qui se déroule maintenant ou temporairement. Utilisez le PRESENT SIMPLE pour parler des vérités permanentes, de votre routine, des règles de sécurité, etc. Apprenez à utiliser les temps du passé PRETERIT (action datée/terminée) et PRESENT PERFECT (l''action continue dans le présent). Revoyez MUST et HAVE TO pour exprimer l''obligation. Revoyez CAN et TO BE ABLE TO pour exprimer la capacité au présent et au futur. Ex. : I can ski but I''ll be able to ski even better at the end of the day!',
  'En conclusion vous avez un niveau faible mais en travaillant vous pouvez arriver à progresser et à combler progressivement vos lacunes grammaticales et lexicales. Et cela vous permettra de vous sentir plus à l''aise sur le terrain.',
  NULL,
  'valide',
  now()
);

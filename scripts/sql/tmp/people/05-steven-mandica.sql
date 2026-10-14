-- steven-mandica / Steven Mandica

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '385e364b-feee-4bff-9656-6656df0cd43c',
  'Steven Mandica',
  'steven-mandica@fli.placeholder.local',
  NULL,
  NULL,
  'Autres',
  NULL,
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '33fbfce0-3a12-4406-9a76-2836bdd0c5f0',
  '385e364b-feee-4bff-9656-6656df0cd43c',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T12:00:00+00',
  'completed',
  'pending',
  false,
  NULL,
  'import_mollard_oct_2026',
  'dsf',
  'eb5e168c-c9e2-4414-a81e-27d5d1f216f9'
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
  '4f215b5b-0015-4747-a3fa-de90445870d9',
  '33fbfce0-3a12-4406-9a76-2836bdd0c5f0',
  'sur_5',
  3, 3, 3, 3, 3, 3,
  'B2',
  'Vous vous exprimez d''une façon assez claire et autonome.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Vous avez de bonnes bases en grammaire et vous êtes capable de vous exprimer dans tous les temps.',
  'En ce qui concerne la partie spécifique à votre métier, vous vous exprimez avec enthousiasme et précision.',
  'En conclusion vous avez un niveau opérationnel qui vous permet de communiquer correctement avec la clientèle anglophone. Continuez néanmoins à développer l''apprentissage de vos connaissances, vous gagnerez en aisance et en fluidité.',
  NULL,
  'valide',
  now()
);

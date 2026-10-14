-- maelys-pietri / Maelys Pietri

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '206bf560-b0bf-445a-baa8-37226d95b3dd',
  'Maelys Pietri',
  'maelys-pietri@fli.placeholder.local',
  NULL,
  'moniteur',
  NULL,
  '86ffc4e5-995c-47dd-be10-21cc583fecb2',
  '52834',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '5973cc7a-c740-465c-b9f7-7d2478e055a6',
  '206bf560-b0bf-445a-baa8-37226d95b3dd',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T11:00:00+00',
  'completed',
  'pending',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  'aeed0587-472e-4c81-8cbd-901895891ac6'
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
  '60e75a80-e569-4f89-a5a2-d89049813289',
  '5973cc7a-c740-465c-b9f7-7d2478e055a6',
  'sur_5',
  3, 3, 3, 2.5, 3, 3,
  'B2',
  'Vous vous exprimez d''une façon assez claire et autonome.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Dans l''ensemble, vous avez une bonne maîtrise des structures simples et complexes mais faites également quelques maladresses ou inexactitudes. Cependant, ces erreurs ne gênent pas la communication.',
  'Concernant la partie spécifique à votre métier, il vous faut vraiment étoffer ce vocabulaire et utiliser les termes et expressions justes et précises de façon à être parfaitement compris par la clientèle anglophone. Vocabulaire : resserrer = to tighten. Barème école Alpe d''Huez /20 d''origine : compréhension 10, expression 10, structures 10, technique 9,5, conversation 11, générale 10.',
  'Vous avez un niveau autonome qui demande à être amélioré sur le plan du lexique.',
  'Barème Alpe d''Huez /20 d''origine : 10, 10, 10, 9.5, 11, 10.',
  'valide',
  now()
);

-- anouk-leynaud / Anouk Leynaud

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'e1473a94-f00c-49b7-b6aa-9966acd9a4c7',
  'Anouk Leynaud',
  'anouk.leynaud@gmail.com',
  '+33643232533',
  'moniteur',
  NULL,
  'c3e047ad-c884-4e2d-8d32-a7fdc7d842b3',
  '43687',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '316cfeb7-883c-4a7f-83eb-9a6e5cb253f0',
  'e1473a94-f00c-49b7-b6aa-9966acd9a4c7',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T09:00:00+00',
  'completed',
  'invoice',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  '54dcaa7a-0fb1-43fd-a1e8-c291cb5c0e18'
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
  '9c8c4ede-6d2b-4894-a334-354accd9daa2',
  '316cfeb7-883c-4a7f-83eb-9a6e5cb253f0',
  'sur_5',
  3.5, 2, 1.5, 2, 1.5, 2.5,
  'B1+',
  'Vous avez envie de vous exprimer mais vous êtes gêné(e) par des erreurs grammaticales et lexicales.',
  'Vous avez très bien compris l''audio. Prononciation : vous oubliez d''expirer le H ; votre accent français est très marqué. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Vocabulaire : perche = tow bar. Apprenez à utiliser les temps du passé PRETERIT et PRESENT PERFECT.',
  'Vous pouvez communiquer mais devez améliorer les structures de vos phrases et la fluidité pour être mieux comprise.',
  NULL,
  'valide',
  now()
);

-- anouk-benamor / Anouk Benamor

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '618e7657-795c-48b2-8f77-4cec1dee531e',
  'Anouk Benamor',
  'anouck.benamor@gmail.com',
  '+33680899968',
  'moniteur',
  NULL,
  'c3e047ad-c884-4e2d-8d32-a7fdc7d842b3',
  '55506',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'f03e0855-1751-47ba-ad14-fc6e13d87525',
  '618e7657-795c-48b2-8f77-4cec1dee531e',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T15:30:00+00',
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
  '824c7d4c-8d16-471c-947c-52bfdff0eaff',
  'f03e0855-1751-47ba-ad14-fc6e13d87525',
  'sur_5',
  3, 2.5, 2.5, 2, 2, 2.5,
  'B1+',
  'Vous vous exprimez d''une façon assez claire et autonome.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Vous oubliez d''expirer le H ce qui nuit parfois à une bonne compréhension. Pour la partie grammaticale vous avez de bonnes bases, attention à quelques petites fautes.',
  'En ce qui concerne la partie spécifique à votre métier, vous pouvez communiquer mais il faut que vous appreniez les mots et expressions précises car actuellement vous manquez de vocabulaire. Vocabulaire : chasse-neige = snowplough, virage = turn. Apprenez PRETERIT et PRESENT PERFECT. Fortement recommandé = highly recommended.',
  'Vous avez un niveau autonome qui demande à être amélioré sur le plan du lexique.',
  NULL,
  'valide',
  now()
);

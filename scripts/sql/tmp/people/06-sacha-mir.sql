-- sacha-mir / Sacha Mir-Emarati

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'ab038adf-47ed-4e1f-a75c-fdb365fffa7f',
  'Sacha Mir-Emarati',
  'sachafmir@gmail.com',
  '+31631367318',
  'moniteur',
  NULL,
  'c3e047ad-c884-4e2d-8d32-a7fdc7d842b3',
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'c19a315f-fae0-41c6-9ae7-9ed66ddbb202',
  'ab038adf-47ed-4e1f-a75c-fdb365fffa7f',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T11:30:00+00',
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
  'c60e0f81-5572-4809-85e9-184e6ec7a121',
  'c19a315f-fae0-41c6-9ae7-9ed66ddbb202',
  'sur_5',
  3.5, 3.5, 3.5, 3.5, 4, 3.5,
  'B2+',
  'Vous vous exprimez avec une certaine aisance et parvenez facilement à vous faire comprendre. Votre vocabulaire est assez riche et les échanges sont agréables.',
  'Vous avez très bien compris le texte audio. Votre niveau de compréhension permet une interaction fluide et agréable. Pour la partie grammaticale vous avez de bonnes bases, attention à quelques petites fautes.',
  'Concernant l''explication technique vous avez bien su expliquer les détails et anticiper les erreurs des débutants. Revoyez MUST et HAVE TO pour exprimer l''obligation ; utilisez SHOULD pour donner un conseil.',
  'En conclusion vous avez un niveau de fluidité qui vous permet de communiquer avec la clientèle anglophone de manière satisfaisante.',
  NULL,
  'valide',
  now()
);

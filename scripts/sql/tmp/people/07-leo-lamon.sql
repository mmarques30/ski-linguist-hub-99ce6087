-- leo-lamon / Léo Lamon

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'f182d2a7-3397-4b40-8438-7483ee0e9907',
  'Léo Lamon',
  'leo-lamon@fli.placeholder.local',
  NULL,
  'moniteur',
  NULL,
  'a33b266c-230c-41a3-b2e4-796b2d59701f',
  '44366',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '9d386ee7-9394-47c7-853a-a1a2b74a186c',
  'f182d2a7-3397-4b40-8438-7483ee0e9907',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T13:00:00+00',
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
  '14370a9b-9f66-4c7a-a818-3c7ba77fad85',
  '9d386ee7-9394-47c7-853a-a1a2b74a186c',
  'sur_5',
  1, 1, 1, 1.5, 1, 1.5,
  'A2+',
  'Vous arrivez à interagir mais l''ensemble manque de fluidité et de justesse.',
  'Votre compréhension du texte audio était trop juste et incomplète. Prononciation : on entend « ze » pour THE — mettez la langue sur les dents du haut pour produire un son anglais TH. Vous oubliez d''expirer le H ce qui nuit parfois à une bonne compréhension. Sur le plan grammatical, vous avez besoin de travailler encore les bases pour utiliser de manière plus spontanée et avec plus de justesse les différents temps et des structures plus justes, il faut automatiser certaines structures pour améliorer le débit et la fluidité.',
  'Vous connaissez le vocabulaire mais les explications ne sont pas toujours claires. Apprenez à utiliser les temps du passé PRETERIT et PRESENT PERFECT. Revoyez MUST et HAVE TO, CAN et TO BE ABLE TO. Utilisez SHOULD pour donner des conseils.',
  'Votre niveau vous permet de comprendre globalement et de vous exprimer en général.',
  NULL,
  'valide',
  now()
);

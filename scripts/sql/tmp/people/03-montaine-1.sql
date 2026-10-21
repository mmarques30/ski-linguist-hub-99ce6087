-- montaine-1 / Montaine Gros-Deleglise

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '1b4dc936-7658-48d1-9c02-3ecae4ebef43',
  'Montaine Gros-Deleglise',
  'deski.grosdeleglisemontaine@gmail.com',
  '+33652075858',
  'moniteur',
  NULL,
  '79be2699-554d-4a0b-b61c-62c6a327eac6',
  '46368',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'b795962e-b1d1-4afa-aecf-a8e4dd8946b6',
  '1b4dc936-7658-48d1-9c02-3ecae4ebef43',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-08T10:00:00+00',
  'completed',
  'bank_transfer',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  '4508792a-bf5c-4fdc-a95c-02f18ae8290a'
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
  '277afb29-633d-4d3f-848c-41b797223768',
  'b795962e-b1d1-4afa-aecf-a8e4dd8946b6',
  'sur_5',
  1, 1.5, 1, 2, 1.5, 1.5,
  'A2+',
  'Votre prononciation et votre accent sont corrects dans l''ensemble, mais il semble que vous manquez de pratique.',
  'Vous comprenez seulement quelques informations. Prononciation : on entend « ze » pour THE — mettez la langue sur les dents du haut pour produire un son anglais TH. Vous avez acquis les bases, mais vous avez encore du mal à les utiliser. Il vous manque de la pratique.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Vocabulaire : inconvénients = drawbacks ; selon = depending on.',
  'Votre niveau vous permet de comprendre globalement et de vous exprimer en général.',
  NULL,
  'valide',
  now()
);

-- lisa-roch / Lisa Roch

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'b67e895b-334b-4dac-8ff6-a9cf31c84c23',
  'Lisa Roch',
  'lisa.roch247@gmail.com',
  '+33646806069',
  'moniteur',
  NULL,
  '1897d121-6d3d-4b92-abee-a0351dcbe6ac',
  NULL,
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '32b29a84-dc57-4de5-9fb5-04bbd5180090',
  'b67e895b-334b-4dac-8ff6-a9cf31c84c23',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-05T14:00:00+00',
  'completed',
  'invoice',
  false,
  NULL,
  'import_mollard_oct_2026',
  'esf',
  '46a2d62b-1b7c-4650-82d6-bb90dd32c2b6'
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
  '287717b6-dbf7-4dae-a149-1e599b78ecd4',
  '32b29a84-dc57-4de5-9fb5-04bbd5180090',
  'sur_5',
  3.5, 1, 1, 1, 1.5, 2,
  'B1',
  'Votre prononciation et votre accent sont corrects dans l''ensemble, mais il semble que vous manquez de pratique.',
  'Vous avez très bien compris le texte audio. Votre niveau de compréhension permet une interaction fluide et agréable. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'En ce qui concerne la partie spécifique à votre métier, il faut absolument que vous sachiez les termes techniques et les expressions car vous en avez besoin pour communiquer avec la clientèle anglophone. Vocabulaire : « station » = la gare ; la station de ski = « ski resort » ; chasse-neige = snowplough. Apprenez à utiliser les temps du passé PRETERIT (action datée/terminée) et PRESENT PERFECT (l''action continue dans le présent).',
  'Vous avez un bon niveau de compréhension mais vous avez besoin de revoir les points de grammaire et d''apprendre du vocabulaire pour être mieux comprise.',
  NULL,
  'valide',
  now()
);

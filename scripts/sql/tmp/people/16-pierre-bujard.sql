-- pierre-bujard / Pierre Bujard

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'ea3a2605-9038-48dd-a330-8572974057a4',
  'Pierre Bujard',
  'bujard.pierre@orange.fr',
  '+33686343987',
  'moniteur',
  NULL,
  '1897d121-6d3d-4b92-abee-a0351dcbe6ac',
  '27097',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '8f5d829b-faa7-4ab1-8f90-e9d7d01a1994',
  'ea3a2605-9038-48dd-a330-8572974057a4',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T15:00:00+00',
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
  '36eceb4c-f81a-4211-9b3d-1997ff88123a',
  '8f5d829b-faa7-4ab1-8f90-e9d7d01a1994',
  'sur_5',
  1.5, 1.5, 1.5, 1, 1, 1,
  'A2',
  'Vous avez envie de vous exprimer mais vous êtes gêné(e) par des erreurs syntaxiques (construction de phrases), grammaticales et lexicales.',
  'Vous comprenez dans la globalité, il manque des informations secondaires. Prononciation : « ze » pour THE ; vous oubliez d''expirer le H. Sur le plan grammatical, vous avez besoin de travailler encore les bases pour utiliser de manière plus spontanée et avec plus de justesse les différents temps et des structures plus justes, il faut automatiser certaines structures pour améliorer le débit et la fluidité.',
  'Vous connaissez le vocabulaire mais les explications ne sont pas toujours claires. Vocabulaire : fortement recommandé = highly recommended ; obligatoire = mandatory. Utilisez PRESENT -ing et PRESENT SIMPLE. Apprenez PRETERIT et PRESENT PERFECT.',
  'Votre niveau vous permet de comprendre globalement et de vous exprimer en général.',
  NULL,
  'valide',
  now()
);

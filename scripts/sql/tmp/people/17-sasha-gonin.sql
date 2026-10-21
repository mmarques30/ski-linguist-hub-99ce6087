-- sasha-gonin / Sasha Gonin-Porquez

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'd7682627-7c6b-4ff4-9ece-dcf9c46c2340',
  'Sasha Gonin-Porquez',
  'goninporquezsasha@gmail.com',
  '+33785742061',
  'moniteur',
  NULL,
  '477839c1-e645-4f92-9bac-6ff7fac08c49',
  '51890',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '2493ed23-8d34-4fc2-86b9-d621d1346534',
  'd7682627-7c6b-4ff4-9ece-dcf9c46c2340',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T14:30:00+00',
  'completed',
  'stripe',
  true,
  'A2',
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
  'deed3466-ef12-4918-bff1-57750b655c05',
  '2493ed23-8d34-4fc2-86b9-d621d1346534',
  'sur_5',
  3.5, 1.5, 1.5, 1.5, 1.5, 1.5,
  'A2+',
  'Vous avez envie de vous exprimer mais vous êtes gêné(e) par des erreurs syntaxiques (construction de phrases), grammaticales et lexicales. Votre prononciation et votre accent sont corrects dans l''ensemble, mais il semble que vous manquez de pratique.',
  'Vous avez très bien compris le texte audio. Votre niveau de compréhension permet une interaction fluide et agréable. Vous oubliez d''expirer le H ce qui nuit parfois à une bonne compréhension. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Concernant la partie spécifique à votre métier, il vous faut vraiment étoffer ce vocabulaire et utiliser les termes et expressions justes et précises de façon à être parfaitement compris par la clientèle anglophone. Vocabulaire : ski lifts = remontées mécaniques ; draglift = téléski. Utilisez PRESENT -ing et PRESENT SIMPLE. Apprenez PRETERIT et PRESENT PERFECT. Revoir SHOULD pour donner un conseil.',
  'Votre niveau de compréhension est bon ; travaillez grammaire et lexique technique pour être mieux compris.',
  NULL,
  'valide',
  now()
);

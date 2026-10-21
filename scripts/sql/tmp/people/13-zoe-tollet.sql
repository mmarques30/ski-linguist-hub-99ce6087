-- zoe-tollet / Zoé Tollet

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  '23921c18-3749-4775-8a33-eeb58351b048',
  'Zoé Tollet',
  'zoetollet@icloud.com',
  '+33672215966',
  'moniteur',
  NULL,
  'c3e047ad-c884-4e2d-8d32-a7fdc7d842b3',
  '55504',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  '50d74ded-b4f1-46e1-9155-9b48f9fd02f6',
  '23921c18-3749-4775-8a33-eeb58351b048',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T17:00:00+00',
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
  'b80999ea-cdf4-4fe5-ba69-fa65850b15ee',
  '50d74ded-b4f1-46e1-9155-9b48f9fd02f6',
  'sur_5',
  3, 2, 2.5, 1.5, 2.5, 2.5,
  'B1+',
  'Vous vous exprimez avec une certaine facilité. Votre vocabulaire est assez riche et les échanges sont agréables.',
  'Vous avez très bien compris le texte audio. Votre niveau de compréhension permet une interaction fluide et agréable. Les structures grammaticales simples et complexes sont bien maîtrisées malgré quelques rares erreurs d''inattention qui ne gênent pas la communication.',
  'En ce qui concerne la partie spécifique à votre métier, vous pouvez communiquer mais il faut que vous appreniez les mots et expressions précises car actuellement vous manquez de vocabulaire. Vocabulaire : téléski = draglift, perche = tow bar ; selon = depending on.',
  'Vous avez un niveau autonome qui demande à être amélioré sur le plan du lexique.',
  NULL,
  'valide',
  now()
);

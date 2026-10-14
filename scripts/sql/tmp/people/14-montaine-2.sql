-- montaine-2 / Montaine Gros-Deleglise
-- candidate réutilisé 1b4dc936-7658-48d1-9c02-3ecae4ebef43

INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'fbf77cf3-6830-46fd-aad3-f3017b8541ca',
  '1b4dc936-7658-48d1-9c02-3ecae4ebef43',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T16:00:00+00',
  'completed',
  'bank_transfer',
  true,
  'A2+',
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
  'c807ba3c-0e7c-4469-b966-ea14a1de5ba2',
  'fbf77cf3-6830-46fd-aad3-f3017b8541ca',
  'sur_5',
  2.5, 2.5, 2.5, 2.5, 2.5, 2.5,
  'B1+',
  'Vous vous exprimez d''une façon assez claire et autonome. Votre débit est plutôt lent et hésitant.',
  'Vous avez plutôt bien compris le texte audio et moi-même. Les structures grammaticales simples et complexes sont bien maîtrisées malgré quelques rares erreurs d''inattention qui ne gênent pas la communication.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Revoir les prépositions AT et TO (ex. : I start at 9AM), ainsi que FOR (ex. : you wait FOR the chairlift).',
  'Vous avez un niveau autonome qui demande à être amélioré sur le plan de la fluidité.',
  NULL,
  'valide',
  now()
);

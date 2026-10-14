-- louise-labrousse / Louise Labrousse

INSERT INTO public.test_candidates (id, name, email, phone, profession, profession_autre, ski_school_id, carte_syndicale, ski_discipline, training_cycle)
VALUES (
  'bbc68d82-0d94-4e8a-820e-da1d486d4a4d',
  'Louise Labrousse',
  'louise.labrousse@gmail.com',
  '+33664192750',
  'moniteur',
  NULL,
  'c3e047ad-c884-4e2d-8d32-a7fdc7d842b3',
  '53990',
  'alpin',
  '1'
);


INSERT INTO public.test_bookings (
  id, candidate_id, instructor_id, language, datetime, status,
  payment_type, previous_test, previous_result, source, sponsor_type, sponsor_id
) VALUES (
  'cca99be6-6635-461c-881b-4fab8c09600d',
  'bbc68d82-0d94-4e8a-820e-da1d486d4a4d',
  'c4f6ec86-ffcb-41f8-a0e9-dc5eca53e40e',
  'anglais',
  '2026-10-12T17:30:00+00',
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
  '09126139-ae70-4f64-ad73-add9362b0bfc',
  'cca99be6-6635-461c-881b-4fab8c09600d',
  'sur_5',
  3, 2, 1, 2.5, 2, 2.5,
  'B1+',
  'Le vocabulaire technique et spécifique a vraisemblablement été appris. Vous prenez le temps d''expliquer les différentes étapes du mouvement technique avec précision mais les maladresses syntaxiques et grammaticales peuvent faire obstacle à une bonne compréhension de vos explications. Vous vous exprimez sans hésitation dans la langue et parvenez globalement à vous faire comprendre.',
  'Vous avez très bien compris le texte audio. Votre niveau de compréhension permet une interaction fluide et agréable. Prononciation : on entend « ze » pour THE. Pour la partie grammaticale vous avez tendance à mélanger les temps, on voit que vous avez quelques connaissances mais il faut les comprendre pour pouvoir employer les bons temps dans le bon contexte.',
  'Vous avez su utiliser un vocabulaire technique plutôt approprié lors de l''explication du mouvement technique et avez pris le temps d''en préciser les différentes étapes. Vocabulaire : learn = apprendre, teach = enseigner. Utilisez PRESENT -ing et PRESENT SIMPLE. Apprenez PRETERIT et PRESENT PERFECT. Dites « to turn » pour « Pour tourner... » (pas « for turn »).',
  'Vous avez un niveau autonome qui demande à être amélioré sur le plan de la grammaire.',
  NULL,
  'valide',
  now()
);

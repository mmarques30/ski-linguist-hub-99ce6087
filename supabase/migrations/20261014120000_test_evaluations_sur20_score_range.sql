-- Alpe d'Huez / Villard Reculas : barème /20.
-- L'ancienne contrainte bornait toutes les notes à 0–5, y compris scoring_system = sur_20.

ALTER TABLE public.test_evaluations
  DROP CONSTRAINT IF EXISTS test_evaluations_scores_half_step_check;

ALTER TABLE public.test_evaluations
  ADD CONSTRAINT test_evaluations_scores_half_step_check CHECK (
    (
      scoring_system = 'sur_5'
      AND score_comprehension >= 0 AND score_comprehension <= 5
      AND (score_comprehension * 2) = trunc(score_comprehension * 2)
      AND score_expression >= 0 AND score_expression <= 5
      AND (score_expression * 2) = trunc(score_expression * 2)
      AND score_structure >= 0 AND score_structure <= 5
      AND (score_structure * 2) = trunc(score_structure * 2)
      AND score_technique >= 0 AND score_technique <= 5
      AND (score_technique * 2) = trunc(score_technique * 2)
      AND score_conversation >= 0 AND score_conversation <= 5
      AND (score_conversation * 2) = trunc(score_conversation * 2)
      AND score_general >= 0 AND score_general <= 5
      AND (score_general * 2) = trunc(score_general * 2)
    )
    OR (
      scoring_system = 'sur_20'
      AND score_comprehension >= 0 AND score_comprehension <= 20
      AND (score_comprehension * 2) = trunc(score_comprehension * 2)
      AND score_expression >= 0 AND score_expression <= 20
      AND (score_expression * 2) = trunc(score_expression * 2)
      AND score_structure >= 0 AND score_structure <= 20
      AND (score_structure * 2) = trunc(score_structure * 2)
      AND score_technique >= 0 AND score_technique <= 20
      AND (score_technique * 2) = trunc(score_technique * 2)
      AND score_conversation >= 0 AND score_conversation <= 20
      AND (score_conversation * 2) = trunc(score_conversation * 2)
      AND score_general >= 0 AND score_general <= 20
      AND (score_general * 2) = trunc(score_general * 2)
    )
  );

COMMENT ON CONSTRAINT test_evaluations_scores_half_step_check ON public.test_evaluations IS
  'Notes par demi-point : 0–5 (sur_5) ou 0–20 (sur_20, Alpe d''Huez / Villard Reculas).';

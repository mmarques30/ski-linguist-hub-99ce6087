import { describe, expect, it } from "vitest";
import {
  SCORE_GENERAL_INCOHERENT,
  isScoreAdjustmentAllowed,
  scoreGeneralCalcule,
  suggestsMethodoNote,
} from "./evaluation-scores";

describe("notes d'évaluation", () => {
  it("calcule la moyenne au demi-point (contrôle, pas une note affichée)", () => {
    expect(
      scoreGeneralCalcule({
        comprehension: 3,
        expression: 3,
        structure: 3,
        technique: 3,
        conversation: 3,
      })
    ).toBe(3);
    expect(
      scoreGeneralCalcule({
        comprehension: 3,
        expression: 3,
        structure: 3,
        technique: 3,
        conversation: 4,
      })
    ).toBe(3);
    expect(
      scoreGeneralCalcule({
        comprehension: 5,
        expression: 5,
        structure: 4,
        technique: 4,
        conversation: 4,
      })
    ).toBe(4.5);
  });

  it("refuse au-delà d'un point, propose une note méthodologique seulement pour un écart d'1", () => {
    expect(isScoreAdjustmentAllowed(4, 3)).toBe(true);
    expect(isScoreAdjustmentAllowed(4.5, 3)).toBe(false);
    expect(SCORE_GENERAL_INCOHERENT).toBe(
      "note générale incohérente avec les cinq compétences"
    );
    expect(suggestsMethodoNote(3, 3)).toBe(false);
    expect(suggestsMethodoNote(3.5, 3)).toBe(false);
    expect(suggestsMethodoNote(2.5, 3)).toBe(false);
    expect(suggestsMethodoNote(4, 3)).toBe(true);
    expect(suggestsMethodoNote(2, 3)).toBe(true);
    expect(suggestsMethodoNote(4.5, 3)).toBe(false);
  });
});

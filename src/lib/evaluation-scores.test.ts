import { describe, expect, it } from "vitest";
import {
  isScoreAdjustmentAllowed,
  needsMethodoNote,
  scoreGeneralCalcule,
} from "./evaluation-scores";

describe("notes d'évaluation", () => {
  it("calcule la moyenne au demi-point", () => {
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

  it("autorise un écart d'au plus 1 et exige une note si non nul", () => {
    expect(isScoreAdjustmentAllowed(4, 3)).toBe(true);
    expect(isScoreAdjustmentAllowed(4.5, 3)).toBe(false);
    expect(needsMethodoNote(3, 3)).toBe(false);
    expect(needsMethodoNote(3.5, 3)).toBe(true);
  });
});

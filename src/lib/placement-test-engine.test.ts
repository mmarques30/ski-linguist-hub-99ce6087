import { describe, expect, it } from "vitest";
import {
  buildAdaptiveTestResult,
  determineLevelFromSlopes,
  evaluateSlope,
  getNextSlopeAfterSlope,
  needsAdminCallFromResults,
  type PlacementQuestion,
  type SlopeResult,
} from "./placement-test-engine";

const sampleQuestions: PlacementQuestion[] = [
  {
    id: "q1",
    question_text: "Q1",
    options: ["a", "b"],
    correct_answer: "a",
    slope: "verte",
    category: "grammaire",
    order_index: 1,
  },
  {
    id: "q2",
    question_text: "Q2",
    options: ["a", "b"],
    correct_answer: "b",
    slope: "verte",
    category: "grammaire",
    order_index: 2,
  },
];

describe("placement-test-engine", () => {
  it("evaluateSlope requires 3 correct answers", () => {
    expect(evaluateSlope(3)).toBe(true);
    expect(evaluateSlope(2)).toBe(false);
  });

  it("determineLevelFromSlopes maps pistes to CEFR", () => {
    expect(determineLevelFromSlopes(["verte"])).toBe("A2");
    expect(determineLevelFromSlopes(["verte", "bleue"])).toBe("B1");
    expect(determineLevelFromSlopes(["rouge"])).toBe("B2");
    expect(determineLevelFromSlopes(["noire"])).toBe("C1");
    expect(determineLevelFromSlopes([])).toBe("A1");
  });

  it("getNextSlopeAfterSlope routes failed slope to vocab", () => {
    expect(getNextSlopeAfterSlope("verte", false)).toBe("vocab_ski");
    expect(getNextSlopeAfterSlope("verte", true)).toBe("bleue");
    expect(getNextSlopeAfterSlope("noire", true)).toBe("done");
  });

  it("needsAdminCall when verte has <=1 correct", () => {
    const results: SlopeResult[] = [{ slope: "verte", correct: 1, total: 5, passed: false }];
    expect(needsAdminCallFromResults(results)).toBe(true);
  });

  it("buildAdaptiveTestResult aggregates answers", () => {
    const slopeResults: SlopeResult[] = [
      { slope: "verte", correct: 4, total: 5, passed: true },
    ];
    const result = buildAdaptiveTestResult(
      sampleQuestions,
      { q1: "a", q2: "b" },
      slopeResults,
      ["verte"],
      false
    );
    expect(result.determinedLevel).toBe("A2");
    expect(result.correctAnswers).toBe(2);
    expect(result.totalAnswered).toBe(2);
  });
});

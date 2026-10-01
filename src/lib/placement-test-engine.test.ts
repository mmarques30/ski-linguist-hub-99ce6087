import { describe, expect, it } from "vitest";
import {
  buildAdaptiveTestResult,
  determineLevelFromSlopes,
  evaluateSlope,
  getNextSlopeAfterSlope,
  hasAdaptedScale,
  needsAdminCallFromResults,
  pisteLabelFromPlacementAnswers,
  PISTE_STAGIAIRE_PAR_DEFAUT,
  studentFacingPisteFromCecrl,
  studentFacingCertificateLabel,
  studentFacingPisteLabel,
  type PlacementQuestion,
  type SlopeResult,
} from "./placement-test-engine";
import { getPlacementQuestions } from "./placement-questions-data";

const sampleQuestions: PlacementQuestion[] = [
  {
    id: "q1",
    question_text: "Q1",
    options: ["a", "b", "je ne sais pas"],
    correct_answer: "a",
    slope: "verte",
    category: "comprehension",
    order_index: 1,
  },
  {
    id: "q2",
    question_text: "Q2",
    options: ["a", "b", "je ne sais pas"],
    correct_answer: "b",
    slope: "verte",
    category: "comprehension",
    order_index: 2,
  },
  {
    id: "v1",
    question_text: "Vocab",
    options: ["x", "y", "je ne sais pas"],
    correct_answer: "x",
    slope: "vocab_ski",
    category: "vocabulary",
    vocabulary_level: "verte",
    order_index: 21,
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

  it("studentFacingPisteLabel never exposes CECRL codes", () => {
    const cecrl = /^(A1|A2|B1|B2|C1|C2)$/i;
    const samples = [
      studentFacingPisteLabel({
        passedSlopes: ["verte", "bleue"],
        highestSlopeReached: "bleue",
      }),
      studentFacingPisteLabel({ passedSlopes: [] }),
      studentFacingPisteFromCecrl("B1"),
      studentFacingPisteFromCecrl("A1"),
      studentFacingPisteFromCecrl("C2"),
      studentFacingPisteFromCecrl(null),
    ];
    expect(samples[0]).toBe("Piste bleue");
    expect(samples[1]).toBe("Piste verte");
    expect(samples[2]).toBe("Piste bleue");
    expect(samples[3]).toBe("Piste verte");
    for (const label of samples) {
      expect(label).not.toMatch(cecrl);
    }
  });

  it("annonce la piste verte quand aucune piste n'est validée", () => {
    expect(PISTE_STAGIAIRE_PAR_DEFAUT).toBe("Piste verte");
    expect(
      studentFacingPisteLabel({
        passedSlopes: [],
        highestSlopeReached: "verte",
      })
    ).toBe("Piste verte");
    expect(studentFacingPisteFromCecrl("a1")).toBe("Piste verte");
    expect(
      pisteLabelFromPlacementAnswers({
        summary: { passedSlopes: [], highestSlopeReached: "verte" },
      })
    ).toBe("Piste verte");
  });

  it("studentFacingCertificateLabel maps CECRL to piste or omits", () => {
    expect(studentFacingCertificateLabel("B2")).toBe("Piste rouge");
    expect(studentFacingCertificateLabel("A1")).toBe("Piste verte");
    expect(studentFacingCertificateLabel("unknown")).toBeNull();
    expect(studentFacingCertificateLabel(null)).toBeNull();
  });

  it("getNextSlopeAfterSlope envoie toujours vers vocab à la fin de l'adaptatif", () => {
    expect(getNextSlopeAfterSlope("verte", false)).toBe("vocab_ski");
    expect(getNextSlopeAfterSlope("verte", true)).toBe("bleue");
    expect(getNextSlopeAfterSlope("bleue", false)).toBe("vocab_ski");
    expect(getNextSlopeAfterSlope("bleue", true)).toBe("rouge");
    expect(getNextSlopeAfterSlope("noire", true)).toBe("vocab_ski");
    expect(getNextSlopeAfterSlope("rouge", false)).toBe("vocab_ski");
  });

  it("2/5 sur une piste ne valide pas (seuil 3)", () => {
    expect(evaluateSlope(2)).toBe(false);
    expect(getNextSlopeAfterSlope("bleue", evaluateSlope(2))).toBe("vocab_ski");
    expect(getNextSlopeAfterSlope("bleue", evaluateSlope(3))).toBe("rouge");
  });

  it("needsAdminCall when verte has <=1 correct", () => {
    const results: SlopeResult[] = [{ slope: "verte", correct: 1, total: 5, passed: false }];
    expect(needsAdminCallFromResults(results)).toBe(true);
  });

  it("buildAdaptiveTestResult expose vocabScore et presentationText", () => {
    const slopeResults: SlopeResult[] = [
      { slope: "verte", correct: 4, total: 5, passed: true },
      { slope: "vocab_ski", correct: 1, total: 1, passed: false },
    ];
    const result = buildAdaptiveTestResult(
      sampleQuestions,
      { q1: "a", q2: "b", v1: "y" },
      slopeResults,
      ["verte"],
      "Bonjour, je suis moniteur."
    );
    expect(result.determinedLevel).toBe("A2");
    expect(result.vocabScore).toEqual({ correct: 0, total: 1 });
    expect(result.vocabAnswers[0].selected).toBe("y");
    expect(result.presentationText).toBe("Bonjour, je suis moniteur.");
    expect(result).not.toHaveProperty("endedAtVocab");
  });

  it("hasAdaptedScale pour DE/NL/RU/ZH", () => {
    expect(hasAdaptedScale("german")).toBe(true);
    expect(hasAdaptedScale("allemand")).toBe(true);
    expect(hasAdaptedScale("english")).toBe(false);
    expect(hasAdaptedScale("chinois")).toBe(true);
  });
});

describe("banque 2026", () => {
  it("anglais : 26 questions, présentation free_text, options non mélangées", () => {
    const qs = getPlacementQuestions("english");
    expect(qs).toHaveLength(26);
    expect(qs.filter((q) => q.slope === "verte")).toHaveLength(5);
    expect(qs.filter((q) => q.slope === "vocab_ski")).toHaveLength(5);
    const presentation = qs.find((q) => q.slope === "presentation");
    expect(presentation?.category).toBe("free_text");
    expect(presentation?.options).toBeNull();
    const q1 = qs[0];
    expect(q1.options?.[4]).toBe("je ne sais pas");
    expect(q1.category).toBe("comprehension");
  });

  it("russe et chinois : caractères non ASCII dans les questions", () => {
    const ru = getPlacementQuestions("russian");
    const zh = getPlacementQuestions("chinese");
    expect(ru.some((q) => /[а-яА-ЯёЁ]/.test(q.question_text + (q.options || []).join("")))).toBe(
      true
    );
    expect(zh.some((q) => /[\u4e00-\u9fff]/.test(q.question_text + (q.options || []).join("")))).toBe(
      true
    );
  });

  it("cas recette moteur : verte 2/5 → piste verte ; 20/20 → noire puis vocab", () => {
    expect(studentFacingPisteLabel({ passedSlopes: [] })).toBe("Piste verte");
    expect(
      studentFacingPisteLabel({ passedSlopes: ["verte", "bleue"] })
    ).toBe("Piste bleue");
    expect(
      studentFacingPisteLabel({
        passedSlopes: ["verte", "bleue", "rouge", "noire"],
      })
    ).toBe("Piste noire");
    expect(getNextSlopeAfterSlope("noire", true)).toBe("vocab_ski");
  });
});

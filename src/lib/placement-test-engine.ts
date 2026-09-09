export type SlopeLevel = "verte" | "bleue" | "rouge" | "noire" | "vocab_ski";

export const SLOPE_ORDER: SlopeLevel[] = ["verte", "bleue", "rouge", "noire"];
export const PASS_THRESHOLD = 3;
export const QUESTIONS_PER_SLOPE = 5;

export const SLOPE_LABELS: Record<SlopeLevel, string> = {
  verte: "Piste verte",
  bleue: "Piste bleue",
  rouge: "Piste rouge",
  noire: "Piste noire",
  vocab_ski: "Vocabulaire ski",
};

export const SLOPE_COLORS: Record<SlopeLevel, string> = {
  verte: "bg-emerald-500",
  bleue: "bg-blue-500",
  rouge: "bg-red-500",
  noire: "bg-gray-900",
  vocab_ski: "bg-amber-500",
};

export interface PlacementQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  slope: SlopeLevel;
  category: string;
  order_index: number;
}

export interface SlopeResult {
  slope: SlopeLevel;
  correct: number;
  total: number;
  passed: boolean;
}

export interface AdaptiveTestResult {
  answers: Record<string, string>;
  slopeResults: SlopeResult[];
  passedSlopes: SlopeLevel[];
  highestSlopeReached: SlopeLevel;
  determinedLevel: string;
  correctAnswers: number;
  totalAnswered: number;
  needsAdminCall: boolean;
  endedAtVocab: boolean;
}

export function evaluateSlope(correct: number, total: number = QUESTIONS_PER_SLOPE): boolean {
  return correct >= PASS_THRESHOLD;
}

export function getNextSlopeAfterSlope(
  currentSlope: SlopeLevel,
  passed: boolean
): SlopeLevel | "done" {
  if (currentSlope === "vocab_ski") return "done";

  if (!passed) return "vocab_ski";

  const idx = SLOPE_ORDER.indexOf(currentSlope);
  if (idx === -1 || idx === SLOPE_ORDER.length - 1) return "done";
  return SLOPE_ORDER[idx + 1];
}

export function determineLevelFromSlopes(passedSlopes: SlopeLevel[]): string {
  if (passedSlopes.includes("noire")) return "C1";
  if (passedSlopes.includes("rouge")) return "B2";
  if (passedSlopes.includes("bleue")) return "B1";
  if (passedSlopes.includes("verte")) return "A2";
  return "A1";
}

/**
 * Libellé piste pour l'UI stagiaire (jamais de code CECRL).
 * Préfère la plus haute piste réussie ; sinon vocab / début de parcours.
 */
export function studentFacingPisteLabel(input: {
  passedSlopes?: SlopeLevel[] | string[] | null;
  highestSlopeReached?: SlopeLevel | string | null;
  endedAtVocab?: boolean | null;
}): string {
  const passed = (input.passedSlopes || []).filter((s): s is SlopeLevel =>
    ["verte", "bleue", "rouge", "noire"].includes(String(s))
  );
  if (passed.length > 0) {
    const order = ["verte", "bleue", "rouge", "noire"] as SlopeLevel[];
    let best: SlopeLevel = passed[0];
    for (const s of passed) {
      if (order.indexOf(s) > order.indexOf(best)) best = s;
    }
    return SLOPE_LABELS[best];
  }
  if (input.endedAtVocab) return SLOPE_LABELS.vocab_ski;
  const high = input.highestSlopeReached;
  if (high && high in SLOPE_LABELS) return SLOPE_LABELS[high as SlopeLevel];
  return "Début de parcours";
}

/** Reverse CECRL → libellé piste (portail, si pas de résumé pistes). */
export function studentFacingPisteFromCecrl(cecrl: string | null | undefined): string {
  if (!cecrl) return "À déterminer";
  const key = cecrl.trim().toUpperCase();
  const map: Record<string, string> = {
    A1: "Début de parcours",
    A2: SLOPE_LABELS.verte,
    B1: SLOPE_LABELS.bleue,
    B2: SLOPE_LABELS.rouge,
    C1: SLOPE_LABELS.noire,
    C2: SLOPE_LABELS.noire,
  };
  return map[key] || "À déterminer";
}

export function pisteLabelFromPlacementAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== "object") return null;
  const summary = (answers as { summary?: Record<string, unknown> }).summary;
  if (!summary) return null;
  return studentFacingPisteLabel({
    passedSlopes: summary.passedSlopes as string[] | undefined,
    highestSlopeReached: summary.highestSlopeReached as string | undefined,
    endedAtVocab: summary.endedAtVocab as boolean | undefined,
  });
}

export function needsAdminCallFromResults(slopeResults: SlopeResult[]): boolean {
  const verte = slopeResults.find((r) => r.slope === "verte");
  return !!verte && !verte.passed && verte.correct <= 1;
}

export function buildAdaptiveTestResult(
  questions: PlacementQuestion[],
  answers: Record<string, string>,
  slopeResults: SlopeResult[],
  passedSlopes: SlopeLevel[],
  endedAtVocab: boolean
): AdaptiveTestResult {
  const answeredQuestions = questions.filter((q) => answers[q.id] !== undefined);
  const correctAnswers = answeredQuestions.filter(
    (q) => answers[q.id] === q.correct_answer
  ).length;

  const grammarSlopes = slopeResults.filter((r) => r.slope !== "vocab_ski");
  const highestSlopeReached =
    grammarSlopes.length > 0
      ? grammarSlopes[grammarSlopes.length - 1].slope
      : "verte";

  return {
    answers,
    slopeResults,
    passedSlopes,
    highestSlopeReached,
    determinedLevel: determineLevelFromSlopes(passedSlopes),
    correctAnswers,
    totalAnswered: answeredQuestions.length,
    needsAdminCall: needsAdminCallFromResults(slopeResults),
    endedAtVocab,
  };
}

export function getQuestionsForSlope(
  questions: PlacementQuestion[],
  slope: SlopeLevel
): PlacementQuestion[] {
  return questions
    .filter((q) => q.slope === slope)
    .sort((a, b) => a.order_index - b.order_index);
}

/** Days before course start when schedule assignment should be reviewed. */
export const SCHEDULE_ASSIGNMENT_DAYS_BEFORE = 10;

export type ScheduleStatus = "pending" | "matin" | "apres-midi";

export function isScheduleAssignmentDue(startDate: string, today = new Date()): boolean {
  const start = new Date(startDate);
  const diffMs = start.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= SCHEDULE_ASSIGNMENT_DAYS_BEFORE && diffDays >= 0;
}

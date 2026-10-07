export type SlopeLevel = "verte" | "bleue" | "rouge" | "noire" | "vocab_ski";

/** Question category codes (normalized from Excel Type column). */
export type PlacementCategory =
  | "comprehension"
  | "guided_production"
  | "translation"
  | "grammar"
  | "vocabulary"
  | "free_text";

export const SLOPE_ORDER: SlopeLevel[] = ["verte", "bleue", "rouge", "noire"];
export const PASS_THRESHOLD = 3;
export const QUESTIONS_PER_SLOPE = 5;
export const PRESENTATION_MAX_CHARS = 1000;

/** Languages whose piste scale is not comparable to EN/ES/… (verte = traduction). */
export const ADAPTED_SCALE_BANK_KEYS = new Set([
  "allemand",
  "neerlandais",
  "russe",
  "chinois",
]);

export const ADAPTED_SCALE_LANGUAGE_KEYS = new Set([
  "german",
  "dutch",
  "russian",
  "chinese",
]);

export function hasAdaptedScale(languageOrBankKey?: string | null): boolean {
  if (!languageOrBankKey) return false;
  const k = languageOrBankKey.trim().toLowerCase();
  return ADAPTED_SCALE_BANK_KEYS.has(k) || ADAPTED_SCALE_LANGUAGE_KEYS.has(k);
}

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
  options: string[] | null;
  correct_answer: string | null;
  slope: SlopeLevel | "presentation";
  category: PlacementCategory | string;
  vocabulary_level?: SlopeLevel | null;
  teacher_notes?: string | null;
  order_index: number;
}

export interface SlopeResult {
  slope: SlopeLevel;
  correct: number;
  total: number;
  passed: boolean;
}

export interface VocabAnswerDetail {
  questionId: string;
  questionText: string;
  selected: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface AdaptiveTestResult {
  answers: Record<string, string>;
  slopeResults: SlopeResult[];
  passedSlopes: SlopeLevel[];
  highestSlopeReached: SlopeLevel;
  determinedLevel: string;
  correctAnswers: number;
  totalAnswered: number;
  vocabScore: { correct: number; total: number };
  vocabAnswers: VocabAnswerDetail[];
  presentationText: string;
  needsAdminCall: boolean;
}

export function evaluateSlope(correct: number, total: number = QUESTIONS_PER_SLOPE): boolean {
  return correct >= PASS_THRESHOLD;
}

/**
 * Next step after a piste (not vocab / presentation).
 * Fail or pass-noire → vocabulaire (toujours).
 * Pass verte/bleue/rouge → piste suivante.
 */
export function getNextSlopeAfterSlope(
  currentSlope: SlopeLevel,
  passed: boolean
): SlopeLevel | "vocab_ski" {
  if (currentSlope === "vocab_ski") return "vocab_ski";

  if (!passed) return "vocab_ski";

  const idx = SLOPE_ORDER.indexOf(currentSlope);
  if (idx === -1 || idx === SLOPE_ORDER.length - 1) return "vocab_ski";
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
 * BL-026 — décision Paula : un·e stagiaire qui ne valide pas la piste verte
 * commence sur la piste verte. Côté stagiaire on annonce donc « Piste verte »,
 * jamais « Vocabulaire ski » ni « Début de parcours ».
 */
export const PISTE_STAGIAIRE_PAR_DEFAUT = SLOPE_LABELS.verte;

/**
 * Libellé piste pour l'UI stagiaire (jamais de code CECRL).
 * Préfère la plus haute piste réussie ; sinon la piste verte.
 */
export function studentFacingPisteLabel(input: {
  passedSlopes?: SlopeLevel[] | string[] | null;
  highestSlopeReached?: SlopeLevel | string | null;
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
  return PISTE_STAGIAIRE_PAR_DEFAUT;
}

/** Reverse CECRL → libellé piste (portail, si pas de résumé pistes). */
export function studentFacingPisteFromCecrl(cecrl: string | null | undefined): string {
  if (!cecrl) return "À déterminer";
  const key = normalizeCecrlCode(cecrl);
  if (!key) return "À déterminer";
  const map: Record<string, string> = {
    A1: PISTE_STAGIAIRE_PAR_DEFAUT,
    A2: SLOPE_LABELS.verte,
    B1: SLOPE_LABELS.bleue,
    B2: SLOPE_LABELS.rouge,
    C1: SLOPE_LABELS.noire,
    C2: SLOPE_LABELS.noire,
  };
  return map[key] || "À déterminer";
}

/**
 * Extrait un code CECRL de base (A1…C2) depuis une valeur stockée, y compris
 * des variantes du type B1a / B1+ / A2.1. Retourne null si ce n'est pas du CECRL.
 */
export function normalizeCecrlCode(raw: string | null | undefined): string | null {
  if (!raw || !String(raw).trim()) return null;
  const upper = String(raw).trim().toUpperCase();
  // Préfixe volontaire : B1a / B1+ / A2.1 → code de base (pas de \b : « 1 » et « a »
  // sont tous deux des word chars en JS, donc B1a ne matcherait pas).
  const match = upper.match(/^(A1|A2|B1|B2|C1|C2)/);
  return match ? match[1] : null;
}

/**
 * Libellé piste pour l'UI admin (et tout affichage hors certificat SNMSF).
 * Le test de placement est trop basique pour présenter l'échelle européenne :
 * on affiche systématiquement la couleur de piste. La base reste en CECRL.
 */
export function displayPisteLabel(
  stored: string | null | undefined,
  emptyLabel = "À déterminer"
): string {
  if (!stored || !String(stored).trim()) return emptyLabel;
  const trimmed = String(stored).trim();
  if (/^piste\s/i.test(trimmed)) return trimmed;
  return studentFacingPisteFromCecrl(trimmed);
}

/** Teinte StatusPill alignée sur la piste (jamais sur un rang CECRL). */
export type PistePillTone = "success" | "info" | "danger" | "neutral";

export function pistePillTone(label: string | null | undefined): PistePillTone {
  const key = String(label || "").trim().toLowerCase();
  if (key.includes("verte")) return "success";
  if (key.includes("bleue")) return "info";
  if (key.includes("rouge")) return "danger";
  if (key.includes("noire")) return "neutral";
  return "neutral";
}

/**
 * Options admin pour choisir une piste tout en écrivant du CECRL
 * (BL-002 : jamais de libellé piste en base).
 * A1/A2 → verte, B1 → bleue, B2 → rouge, C1/C2 → noire.
 */
export const PISTE_ENTRY_OPTIONS = [
  { cecrl: "A1", label: SLOPE_LABELS.verte },
  { cecrl: "B1", label: SLOPE_LABELS.bleue },
  { cecrl: "B2", label: SLOPE_LABELS.rouge },
  { cecrl: "C1", label: SLOPE_LABELS.noire },
] as const;

/** Normalise un CECRL stocké vers la valeur d'option piste (A2→A1, C2→C1). */
export function pisteEntrySelectValue(cecrl: string | null | undefined): string {
  const piste = displayPisteLabel(cecrl, "");
  const found = PISTE_ENTRY_OPTIONS.find((o) => o.label === piste);
  return found?.cecrl ?? "A1";
}

/**
 * @deprecated Ne plus utiliser pour les certificats.
 * Le certificat porte un bilan Entrée/Sortie (`docs/CERTIFICAT_BILAN_PROGRESSION.md`),
 * jamais la piste comme niveau final. Conservé pour compat tests / éventuel affichage hors certificat.
 */
export function studentFacingCertificateLabel(
  levelAchieved: string | null | undefined
): string | null {
  if (!levelAchieved || !String(levelAchieved).trim()) return null;
  const key = String(levelAchieved).trim().toUpperCase();
  if (!/^(A1|A2|B1|B2|C1|C2)$/.test(key)) return null;
  return studentFacingPisteFromCecrl(key);
}

export function pisteLabelFromPlacementAnswers(answers: unknown): string | null {
  if (!answers || typeof answers !== "object") return null;
  const summary = (answers as { summary?: Record<string, unknown> }).summary;
  if (!summary) return null;
  return studentFacingPisteLabel({
    passedSlopes: summary.passedSlopes as string[] | undefined,
    highestSlopeReached: summary.highestSlopeReached as string | undefined,
  });
}

export function needsAdminCallFromResults(slopeResults: SlopeResult[]): boolean {
  const verte = slopeResults.find((r) => r.slope === "verte");
  return !!verte && !verte.passed && verte.correct <= 1;
}

export function buildVocabDetails(
  questions: PlacementQuestion[],
  answers: Record<string, string>
): VocabAnswerDetail[] {
  return getQuestionsForSlope(questions, "vocab_ski").map((q) => {
    const selected = answers[q.id] ?? "";
    const correctAnswer = q.correct_answer ?? "";
    return {
      questionId: q.id,
      questionText: q.question_text,
      selected,
      correctAnswer,
      isCorrect: selected === correctAnswer,
    };
  });
}

export function buildAdaptiveTestResult(
  questions: PlacementQuestion[],
  answers: Record<string, string>,
  slopeResults: SlopeResult[],
  passedSlopes: SlopeLevel[],
  presentationText: string
): AdaptiveTestResult {
  const scoredQuestions = questions.filter(
    (q) => q.slope !== "presentation" && answers[q.id] !== undefined
  );
  const correctAnswers = scoredQuestions.filter(
    (q) => q.correct_answer != null && answers[q.id] === q.correct_answer
  ).length;

  const grammarSlopes = slopeResults.filter((r) => r.slope !== "vocab_ski");
  const highestSlopeReached =
    grammarSlopes.length > 0
      ? grammarSlopes[grammarSlopes.length - 1].slope
      : "verte";

  const vocabAnswers = buildVocabDetails(questions, answers);
  const vocabCorrect = vocabAnswers.filter((v) => v.isCorrect).length;

  return {
    answers,
    slopeResults,
    passedSlopes,
    highestSlopeReached,
    determinedLevel: determineLevelFromSlopes(passedSlopes),
    correctAnswers,
    totalAnswered: scoredQuestions.length,
    vocabScore: { correct: vocabCorrect, total: vocabAnswers.length },
    vocabAnswers,
    presentationText: presentationText.slice(0, PRESENTATION_MAX_CHARS),
    needsAdminCall: needsAdminCallFromResults(slopeResults),
  };
}

export function getQuestionsForSlope(
  questions: PlacementQuestion[],
  slope: SlopeLevel | "presentation"
): PlacementQuestion[] {
  return questions
    .filter((q) => q.slope === slope)
    .sort((a, b) => a.order_index - b.order_index);
}

export function getPresentationQuestion(
  questions: PlacementQuestion[]
): PlacementQuestion | undefined {
  return getQuestionsForSlope(questions, "presentation")[0];
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

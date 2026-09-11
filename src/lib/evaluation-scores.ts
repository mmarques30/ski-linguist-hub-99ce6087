/** Moyenne des cinq notes, demi-point, ajustement ≤ 1 (C.2 / C.3). */

export const SCORE_KEYS = [
  "comprehension",
  "expression",
  "structure",
  "technique",
  "conversation",
] as const;

export type FiveScores = Record<(typeof SCORE_KEYS)[number], number>;

export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function scoreGeneralCalcule(scores: FiveScores): number {
  const sum = SCORE_KEYS.reduce((acc, key) => acc + scores[key], 0);
  return roundToHalf(sum / SCORE_KEYS.length);
}

export function scoreAdjustmentDelta(
  general: number,
  calcule: number
): number {
  return Math.round((general - calcule) * 2) / 2;
}

export function isScoreAdjustmentAllowed(
  general: number,
  calcule: number
): boolean {
  return Math.abs(scoreAdjustmentDelta(general, calcule)) <= 1;
}

export function needsMethodoNote(general: number, calcule: number): boolean {
  return scoreAdjustmentDelta(general, calcule) !== 0;
}

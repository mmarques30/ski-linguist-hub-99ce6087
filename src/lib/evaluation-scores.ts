/** Moyenne des cinq notes, demi-point. Contrôle d'écart (C.5). */

export const SCORE_KEYS = [
  "comprehension",
  "expression",
  "structure",
  "technique",
  "conversation",
] as const;

export type FiveScores = Record<(typeof SCORE_KEYS)[number], number>;

/** Message de refus si |générale − moyenne| > 1. */
export const SCORE_GENERAL_INCOHERENT =
  "note générale incohérente avec les cinq compétences";

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

/**
 * Propose une note méthodologique (sans l'imposer) si l'écart est
 * strictement supérieur à 0,5 et au plus 1 (demi-points : exactement 1).
 * Écart nul ou 0,5 : rien. Au-delà de 1 : refus, pas de proposition.
 */
export function suggestsMethodoNote(general: number, calcule: number): boolean {
  const abs = Math.abs(scoreAdjustmentDelta(general, calcule));
  return abs > 0.5 && abs <= 1;
}

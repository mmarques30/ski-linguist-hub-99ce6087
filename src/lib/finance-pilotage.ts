/**
 * Helpers purs pour le pilotage financier (Onda D / §9.8).
 * Isolés pour tests unitaires (double comptage, objectifs saison).
 */

/** Entrées prévisionnelles : factures dues uniquement (pas inscription.price en plus). */
export function tresorerieEntrees(params: {
  facturesAEncaisser: number;
  /** @deprecated ne pas additionner — double comptage avec les factures */
  formationsPlanifiees?: number;
}): number {
  return Math.max(0, Number(params.facturesAEncaisser) || 0);
}

/**
 * Formateurs à payer : uniquement le mois où tombe `periode_fin`
 * (évite de recompter chaque mois suivant).
 */
export function formateursAPayerDuMois(params: {
  unpaid: { montant: number | null; periode_fin: string | null }[];
  startOfMonth: string;
  endOfMonth: string;
}): number {
  return params.unpaid
    .filter((p) => {
      if (!p.periode_fin) return false;
      return p.periode_fin >= params.startOfMonth && p.periode_fin <= params.endOfMonth;
    })
    .reduce((sum, p) => sum + Number(p.montant || 0), 0);
}

export function tresorerieSolde(params: {
  entrees: number;
  chargesFixes: number;
  formateursAPayer: number;
}): number {
  return params.entrees - params.chargesFixes - params.formateursAPayer;
}

/**
 * Objectif CA : `seasons.revenue_target`.
 * `null` / NaN / ≤ 0 → non défini (en live la saison courante a `0`, pas NULL).
 */
export function resolveRevenueTarget(
  season: { revenue_target: number | null } | null | undefined
): number | null {
  if (!season) return null;
  const t = Number(season.revenue_target);
  if (!Number.isFinite(t) || t <= 0) return null;
  return t;
}

export function progressTowardTarget(current: number, target: number | null): number | null {
  if (target == null || target <= 0) return null;
  return Math.min(100, Math.round((current / target) * 1000) / 10);
}

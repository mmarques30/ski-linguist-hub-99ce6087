/**
 * Palette data-viz FLI.
 *
 * L'ordre des séries est FIGÉ et validé (séparation CVD ΔE ≥ 8 sur les paires
 * adjacentes, en clair comme en sombre). Ne jamais réordonner ni générer une
 * 7e teinte : au-delà de 6 séries, replier le reste sur « Autre ».
 *
 * Les valeurs vivent dans `src/index.css` (--chart-1..6) pour que le mode
 * sombre bascule sans toucher au code des graphiques.
 */

export const SERIES_SLOTS = 6 as const;

/** Couleur d'une série par index (0-based), en boucle interdite au-delà de 6. */
export function seriesColor(index: number): string {
  const slot = Math.min(index, SERIES_SLOTS - 1) + 1;
  return `hsl(var(--chart-${slot}))`;
}

/** Les 6 couleurs de série, dans l'ordre. */
export const SERIES_COLORS: string[] = Array.from(
  { length: SERIES_SLOTS },
  (_, i) => `hsl(var(--chart-${i + 1}))`
);

/** Rampe séquentielle (magnitude continue) — une seule teinte, clair → foncé. */
export const SEQUENTIAL_COLORS: string[] = Array.from(
  { length: 6 },
  (_, i) => `hsl(var(--chart-seq-${i + 1}))`
);

/** Couleurs d'état — réservées, jamais utilisées comme série. */
export const STATE_COLORS = {
  good: "hsl(var(--status-good))",
  warning: "hsl(var(--status-warning))",
  serious: "hsl(var(--status-serious))",
  critical: "hsl(var(--status-critical))",
} as const;

export type StateTone = keyof typeof STATE_COLORS;

/** Habillage commun des axes / grilles. */
export const CHART_CHROME = {
  grid: "hsl(var(--chart-grid))",
  axis: "hsl(var(--chart-axis))",
  cursor: "hsl(var(--chart-cursor))",
  surface: "hsl(var(--surface-raised))",
} as const;

/**
 * Répartit N catégories sur les 6 emplacements en repliant le surplus.
 * Retourne les éléments à tracer plus, le cas échéant, une entrée « Autre ».
 */
export function foldToSeriesCap<T extends { name: string; value: number }>(
  items: T[],
  otherLabel = "Autre"
): Array<T | { name: string; value: number; isOther: true }> {
  if (items.length <= SERIES_SLOTS) return items;
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, SERIES_SLOTS - 1);
  const tail = sorted.slice(SERIES_SLOTS - 1);
  const otherValue = tail.reduce((sum, item) => sum + item.value, 0);
  return [...head, { name: otherLabel, value: otherValue, isOther: true as const }];
}

/** Teintes pastel des tuiles KPI — indépendantes de la palette des séries. */
export const TILE_TONES = [
  "gold",
  "blue",
  "teal",
  "purple",
  "orange",
  "rose",
  "navy",
  "neutral",
] as const;

export type TileTone = (typeof TILE_TONES)[number];

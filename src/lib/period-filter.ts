import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getFiscalYear,
  getFiscalYearBounds,
  getPreviousFiscalYear,
} from "@/lib/fiscal-year";

/** Presets du filtre période global (header). */
export type PeriodFilterValue =
  | "all"
  | "fiscal-current"
  | "fiscal-previous"
  | "season-current"
  | "season-previous"
  | "month-current"
  | "month-previous";

export const PERIOD_FILTER_VALUES: PeriodFilterValue[] = [
  "fiscal-current",
  "fiscal-previous",
  "season-current",
  "season-previous",
  "month-current",
  "month-previous",
  "all",
];

export type PeriodSeasonLike = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export type ResolvedPeriod = {
  filter: PeriodFilterValue;
  /** UUID saison quand le preset est saisonnier et résolu. */
  seasonId: string | null;
  season: PeriodSeasonLike | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  /** Libellé court pour le bouton. */
  label: string;
};

function ymd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Saison précédente = celle dont `start_date` est juste avant la saison courante. */
export function findPreviousSeason(
  seasons: PeriodSeasonLike[],
  current: PeriodSeasonLike | null,
): PeriodSeasonLike | null {
  if (!current) {
    const sorted = [...seasons].sort((a, b) => b.start_date.localeCompare(a.start_date));
    return sorted[0] ?? null;
  }
  const earlier = seasons
    .filter((s) => s.start_date < current.start_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  return earlier[0] ?? null;
}

/**
 * Migre les anciennes valeurs stockées (`all` | `current` | uuid)
 * vers les presets période.
 */
export function migrateStoredPeriodFilter(
  raw: string | null,
  seasons: PeriodSeasonLike[],
  current: PeriodSeasonLike | null,
): PeriodFilterValue {
  if (!raw) return "all";
  if ((PERIOD_FILTER_VALUES as string[]).includes(raw)) {
    return raw as PeriodFilterValue;
  }
  if (raw === "current") return "season-current";
  if (raw === "all") return "all";
  if (current && raw === current.id) return "season-current";
  const prev = findPreviousSeason(seasons, current);
  if (prev && raw === prev.id) return "season-previous";
  return "all";
}

export function resolvePeriodFilter(
  filter: PeriodFilterValue,
  seasons: PeriodSeasonLike[],
  currentSeason: PeriodSeasonLike | null,
  today: Date = new Date(),
): ResolvedPeriod {
  const previousSeason = findPreviousSeason(seasons, currentSeason);
  const fiscalNow = getFiscalYear(today);
  const fiscalPrev = getPreviousFiscalYear(fiscalNow);

  switch (filter) {
    case "all":
      return {
        filter,
        seasonId: null,
        season: null,
        seasonStart: null,
        seasonEnd: null,
        label: "Toutes les périodes",
      };
    case "fiscal-current": {
      const { start, end } = getFiscalYearBounds(fiscalNow);
      return {
        filter,
        seasonId: null,
        season: null,
        seasonStart: ymd(start),
        seasonEnd: ymd(end),
        label: `Année comptable (${fiscalNow})`,
      };
    }
    case "fiscal-previous": {
      const { start, end } = getFiscalYearBounds(fiscalPrev);
      return {
        filter,
        seasonId: null,
        season: null,
        seasonStart: ymd(start),
        seasonEnd: ymd(end),
        label: `Année comptable N-1 (${fiscalPrev})`,
      };
    }
    case "season-current":
      return {
        filter,
        seasonId: currentSeason?.id ?? null,
        season: currentSeason,
        seasonStart: currentSeason?.start_date ?? null,
        seasonEnd: currentSeason?.end_date ?? null,
        label: currentSeason
          ? `Saison en cours (${currentSeason.name})`
          : "Saison en cours",
      };
    case "season-previous":
      return {
        filter,
        seasonId: previousSeason?.id ?? null,
        season: previousSeason,
        seasonStart: previousSeason?.start_date ?? null,
        seasonEnd: previousSeason?.end_date ?? null,
        label: previousSeason
          ? `Saison N-1 (${previousSeason.name})`
          : "Saison N-1",
      };
    case "month-current": {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return {
        filter,
        seasonId: null,
        season: null,
        seasonStart: ymd(start),
        seasonEnd: ymd(end),
        label: `Mois en cours (${format(today, "MMMM yyyy", { locale: fr })})`,
      };
    }
    case "month-previous": {
      const prev = subMonths(today, 1);
      const start = startOfMonth(prev);
      const end = endOfMonth(prev);
      return {
        filter,
        seasonId: null,
        season: null,
        seasonStart: ymd(start),
        seasonEnd: ymd(end),
        label: `Mois N-1 (${format(prev, "MMMM yyyy", { locale: fr })})`,
      };
    }
    default:
      return {
        filter: "all",
        seasonId: null,
        season: null,
        seasonStart: null,
        seasonEnd: null,
        label: "Toutes les périodes",
      };
  }
}

/** Options du menu (presets métier, sans « toutes »). */
export function periodMenuOptions(
  seasons: PeriodSeasonLike[],
  currentSeason: PeriodSeasonLike | null,
  today: Date = new Date(),
): { value: PeriodFilterValue; label: string }[] {
  return PERIOD_FILTER_VALUES.filter((v) => v !== "all").map((value) => ({
    value,
    label: resolvePeriodFilter(value, seasons, currentSeason, today).label,
  }));
}

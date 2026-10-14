import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCurrentSeason, useSeasons, type Season } from "@/hooks/useSeasons";
import {
  migrateStoredPeriodFilter,
  PERIOD_FILTER_VALUES,
  resolvePeriodFilter,
  type PeriodFilterValue,
} from "@/lib/period-filter";

const STORAGE_KEY = "fli.seasonFilter";

/** @deprecated Utiliser PeriodFilterValue — alias de compatibilité. */
export type SeasonFilterValue = PeriodFilterValue;

type SeasonContextValue = {
  /** Preset période (année comptable / saison / mois ± N-1, ou toutes). */
  filter: PeriodFilterValue;
  setFilter: (v: PeriodFilterValue) => void;
  /** true si un filtre actif (pas « toutes »). */
  isFiltered: boolean;
  /** UUID saison quand preset saisonnier résolu. */
  seasonId: string | null;
  /** Saison résolue (null hors presets saison). */
  season: Season | null;
  /** Bornes dates du filtre — listes où `season_id` est encore NULL. */
  seasonStart: string | null;
  seasonEnd: string | null;
  /** Libellé du preset (bouton header). */
  periodLabel: string;
  seasons: Season[];
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

function readRawStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function initialFilter(): PeriodFilterValue {
  const raw = readRawStored();
  if (raw && (PERIOD_FILTER_VALUES as string[]).includes(raw)) {
    return raw as PeriodFilterValue;
  }
  if (raw === "current") return "season-current";
  // Défaut « toutes » : en prod quasi toutes les lignes ont season_id NULL.
  return "all";
}

function initialLegacyUuid(): string | null {
  const raw = readRawStored();
  if (!raw) return null;
  if ((PERIOD_FILTER_VALUES as string[]).includes(raw)) return null;
  if (raw === "current" || raw === "all") return null;
  return raw;
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { data: seasons = [] } = useSeasons();
  const { data: currentSeason } = useCurrentSeason();
  const [filter, setFilterState] = useState<PeriodFilterValue>(initialFilter);
  const [legacyUuid] = useState<string | null>(initialLegacyUuid);

  const setFilter = useCallback((v: PeriodFilterValue) => {
    setFilterState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  // Une seule fois : uuid historique → preset saison courante / N-1 / toutes.
  useEffect(() => {
    if (!legacyUuid) return;
    if (seasons.length === 0 && !currentSeason) return;
    const migrated = migrateStoredPeriodFilter(
      legacyUuid,
      seasons,
      currentSeason ?? null,
    );
    setFilter(migrated);
  }, [legacyUuid, seasons, currentSeason, setFilter]);

  const resolved = useMemo(
    () => resolvePeriodFilter(filter, seasons, currentSeason ?? null),
    [filter, seasons, currentSeason],
  );

  const isFiltered = filter !== "all";

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      isFiltered,
      seasonId: resolved.seasonId,
      season: (resolved.season as Season | null) ?? null,
      seasonStart: resolved.seasonStart,
      seasonEnd: resolved.seasonEnd,
      periodLabel: resolved.label,
      seasons,
    }),
    [filter, setFilter, isFiltered, resolved, seasons],
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeasonFilter(): SeasonContextValue {
  const ctx = useContext(SeasonContext);
  if (!ctx) {
    throw new Error("useSeasonFilter must be used within SeasonProvider");
  }
  return ctx;
}

export function useSeasonFilterOptional(): SeasonContextValue | null {
  return useContext(SeasonContext);
}

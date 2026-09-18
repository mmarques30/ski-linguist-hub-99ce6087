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

const STORAGE_KEY = "fli.seasonFilter";

export type SeasonFilterValue = "all" | "current" | string;

type SeasonContextValue = {
  /** "all" | "current" | uuid saison */
  filter: SeasonFilterValue;
  setFilter: (v: SeasonFilterValue) => void;
  /** true si un filtre saison actif (pas « toutes »). */
  isFiltered: boolean;
  /** UUID saison quand filtre explicite / courant résolu. */
  seasonId: string | null;
  /** Saison résolue pour le filtre (null si « toutes »). */
  season: Season | null;
  /** Bornes dates de la saison filtrée — pour listes où `season_id` est encore NULL. */
  seasonStart: string | null;
  seasonEnd: string | null;
  seasons: Season[];
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

function readStored(): SeasonFilterValue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "all" || raw === "current" || (raw && raw.length > 8)) return raw;
  } catch {
    /* ignore */
  }
  // Défaut « toutes » : en prod quasi toutes les lignes ont season_id NULL.
  return "all";
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { data: seasons = [] } = useSeasons();
  const { data: currentSeason } = useCurrentSeason();
  const [filter, setFilterState] = useState<SeasonFilterValue>(readStored);

  const setFilter = useCallback((v: SeasonFilterValue) => {
    setFilterState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const isFiltered = filter !== "all";

  const season = useMemo(() => {
    if (filter === "all") return null;
    if (filter === "current") return currentSeason ?? null;
    return seasons.find((s) => s.id === filter) ?? null;
  }, [filter, seasons, currentSeason]);

  const seasonId = season?.id ?? null;
  const seasonStart = season?.start_date ?? null;
  const seasonEnd = season?.end_date ?? null;

  useEffect(() => {
    if (filter !== "current" && filter !== "all") {
      const exists = seasons.some((s) => s.id === filter);
      if (seasons.length > 0 && !exists) setFilter("all");
    }
  }, [filter, seasons, setFilter]);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      isFiltered,
      seasonId,
      season,
      seasonStart,
      seasonEnd,
      seasons,
    }),
    [filter, setFilter, isFiltered, seasonId, season, seasonStart, seasonEnd, seasons]
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

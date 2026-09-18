import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCurrentSeason, useSeasons, type Season } from "@/hooks/useSeasons";

const STORAGE_KEY = "fli.seasonFilter";

export type SeasonFilterValue = "all" | "current" | string;

type SeasonContextValue = {
  /** "all" | "current" | uuid saison */
  filter: SeasonFilterValue;
  setFilter: (v: SeasonFilterValue) => void;
  /** UUID résolu pour les requêtes (null = pas de filtre). */
  seasonId: string | null;
  season: Season | null;
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
  return "current";
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

  const seasonId = useMemo(() => {
    if (filter === "all") return null;
    if (filter === "current") return currentSeason?.id ?? null;
    return filter;
  }, [filter, currentSeason?.id]);

  const season = useMemo(() => {
    if (!seasonId) return currentSeason ?? null;
    return seasons.find((s) => s.id === seasonId) ?? currentSeason ?? null;
  }, [seasonId, seasons, currentSeason]);

  // Si "current" mais pas encore de saison courante chargée, rester null (pas de filtre forcé)
  useEffect(() => {
    if (filter !== "current" && filter !== "all") {
      const exists = seasons.some((s) => s.id === filter);
      if (seasons.length > 0 && !exists) setFilter("current");
    }
  }, [filter, seasons, setFilter]);

  const value = useMemo(
    () => ({ filter, setFilter, seasonId, season, seasons }),
    [filter, setFilter, seasonId, season, seasons]
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

/** Variante safe hors provider (tests / pages isolées). */
export function useSeasonFilterOptional(): SeasonContextValue | null {
  return useContext(SeasonContext);
}

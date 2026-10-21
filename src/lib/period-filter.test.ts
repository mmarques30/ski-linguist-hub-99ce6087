import { describe, expect, it } from "vitest";
import {
  findPreviousSeason,
  migrateStoredPeriodFilter,
  resolvePeriodFilter,
  type PeriodSeasonLike,
} from "./period-filter";

const seasons: PeriodSeasonLike[] = [
  {
    id: "s-cur",
    name: "Saison 2026-2027",
    start_date: "2026-07-01",
    end_date: "2027-06-30",
    is_current: true,
  },
  {
    id: "s-prev",
    name: "Saison 2025-2026",
    start_date: "2025-10-01",
    end_date: "2026-06-30",
    is_current: false,
  },
];

const current = seasons[0];

describe("findPreviousSeason", () => {
  it("prend la saison immédiatement antérieure", () => {
    expect(findPreviousSeason(seasons, current)?.id).toBe("s-prev");
  });
});

describe("migrateStoredPeriodFilter", () => {
  it("migre current → season-current", () => {
    expect(migrateStoredPeriodFilter("current", seasons, current)).toBe("season-current");
  });

  it("migre l'uuid de la saison courante", () => {
    expect(migrateStoredPeriodFilter("s-cur", seasons, current)).toBe("season-current");
  });

  it("conserve les nouveaux presets", () => {
    expect(migrateStoredPeriodFilter("fiscal-current", seasons, current)).toBe("fiscal-current");
  });
});

describe("resolvePeriodFilter", () => {
  const today = new Date(2026, 9, 14); // 14 oct 2026

  it("résout l'année comptable et N-1", () => {
    const cur = resolvePeriodFilter("fiscal-current", seasons, current, today);
    expect(cur.label).toContain("Année comptable");
    expect(cur.seasonStart).toBe("2026-07-01");
    expect(cur.seasonEnd).toBe("2027-06-30");
    expect(cur.seasonId).toBeNull();

    const prev = resolvePeriodFilter("fiscal-previous", seasons, current, today);
    expect(prev.label).toContain("N-1");
    expect(prev.seasonStart).toBe("2025-10-01");
    expect(prev.seasonEnd).toBe("2026-06-30");
  });

  it("résout saison en cours et N-1 sans doublon d'uuid listé", () => {
    const cur = resolvePeriodFilter("season-current", seasons, current, today);
    expect(cur.seasonId).toBe("s-cur");
    expect(cur.label).toBe("Saison en cours (Saison 2026-2027)");

    const prev = resolvePeriodFilter("season-previous", seasons, current, today);
    expect(prev.seasonId).toBe("s-prev");
    expect(prev.label).toBe("Saison N-1 (Saison 2025-2026)");
  });

  it("résout mois en cours et N-1", () => {
    const cur = resolvePeriodFilter("month-current", seasons, current, today);
    expect(cur.seasonStart).toBe("2026-10-01");
    expect(cur.seasonEnd).toBe("2026-10-31");
    expect(cur.label.toLowerCase()).toContain("octobre");

    const prev = resolvePeriodFilter("month-previous", seasons, current, today);
    expect(prev.seasonStart).toBe("2026-09-01");
    expect(prev.seasonEnd).toBe("2026-09-30");
  });
});

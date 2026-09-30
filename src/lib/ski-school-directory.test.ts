import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OTHER_SCHOOL_OPTION,
  SKI_NETWORKS,
  formatSchoolOption,
  isDirectoryNetwork,
  isValidCarteSyndicale,
  resolveSkiSchoolLabel,
} from "./ski-school-directory";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("ski-school-directory helpers", () => {
  it("expose les 7 réseaux du cahier des charges", () => {
    expect(SKI_NETWORKS.map((n) => n.value)).toEqual([
      "ESF",
      "ESI",
      "Evolution 2",
      "Prosneige",
      "Oxygène",
      "Indépendant.e",
      "Autre",
    ]);
  });

  it("distingue réseaux à liste fermée", () => {
    expect(isDirectoryNetwork("ESF")).toBe(true);
    expect(isDirectoryNetwork("Indépendant.e")).toBe(false);
    expect(isDirectoryNetwork("Autre")).toBe(false);
  });

  it("valide la carte syndicale (5 chiffres ou en attente)", () => {
    expect(isValidCarteSyndicale("12345", false)).toBe(true);
    expect(isValidCarteSyndicale("1234", false)).toBe(false);
    expect(isValidCarteSyndicale("", true)).toBe(true);
  });

  it("résout le libellé école pour company", () => {
    expect(
      resolveSkiSchoolLabel({
        skiNetwork: "ESF",
        skiSchoolName: "ESF Val Cenis",
      })
    ).toBe("ESF Val Cenis");
    expect(
      resolveSkiSchoolLabel({
        skiNetwork: "ESF",
        skiSchoolCode: OTHER_SCHOOL_OPTION,
        skiSchoolOther: "ESF Inconnue",
      })
    ).toBe("ESF Inconnue");
    expect(
      resolveSkiSchoolLabel({
        skiNetwork: "Indépendant.e",
        stationOrValley: "Tarentaise",
      })
    ).toBe("Tarentaise");
  });

  it("formate l'option avec département", () => {
    expect(
      formatSchoolOption({
        id: "1",
        reseau: "ESF",
        code: "esf-668",
        nom_affiche: "ESF Val Cenis",
        station: "Val Cenis",
        departement: "73",
      })
    ).toBe("ESF Val Cenis (73)");
  });
});

describe("référentiel écoles — câblage", () => {
  it("fichiers source et migrations présents", () => {
    expect(existsSync(join(process.cwd(), "docs/data/referentiel_ecoles_de_ski_app.csv"))).toBe(
      true
    );
    expect(existsSync(join(process.cwd(), "docs/SESSIONS_2026_2027.md"))).toBe(true);
    const schema = source("supabase/migrations/20260930100000_ski_school_directory.sql");
    expect(schema).toContain("ski_school_directory");
    expect(schema).toContain("ski_network");
    expect(schema).toContain("carte_syndicale");
    const seed = source("supabase/migrations/20260930100001_ski_school_directory_seed.sql");
    expect(seed).toContain("esf-668");
    expect(seed).toContain("esf-422");
    // Source Paula : 323 lignes dont 1 doublon esf-389 → 322 uniques (209 ESF)
    expect((seed.match(/\('ESF'/g) || []).length).toBe(209);
    expect((seed.match(/^\('/gm) || []).length).toBe(322);
  });

  it("étape profil utilise réseau → école", () => {
    const step = source("src/components/registration/ProfessionalProfileStep.tsx");
    expect(step).toContain("skiNetwork");
    expect(step).toContain("useSkiSchoolDirectory");
    expect(step).toContain("carteSyndicale");
    expect(step).toContain("Indépendant");
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain("ski_school_code");
    expect(edge).toContain("carte_syndicale");
  });
});

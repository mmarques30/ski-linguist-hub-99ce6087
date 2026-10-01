import { describe, expect, it } from "vitest";
import {
  formatPresenceDate,
  presenceFicheFilename,
  presenceFormationTitle,
  presenceLocationLabel,
} from "@/lib/presence-fiches-pdf";

describe("presenceFormationTitle", () => {
  it("calibre les intitulés des modèles Word", () => {
    expect(presenceFormationTitle("formateur", "Anglais")).toBe(
      "formation individualisée Anglais"
    );
    expect(presenceFormationTitle("stagiaire", "Portugais")).toBe(
      "Formation en ligne individuelle en Portugais."
    );
  });
});

describe("formatPresenceDate", () => {
  it("affiche jj/m/aaaa comme les modèles", () => {
    expect(formatPresenceDate("2025-09-22")).toBe("22/9/2025");
    expect(formatPresenceDate("2026-03-06")).toBe("6/3/2026");
  });
});

describe("presenceLocationLabel", () => {
  it("préfère le lieu saisi, sinon En ligne", () => {
    expect(presenceLocationLabel({ courseLocation: "Les Arcs" })).toBe("Les Arcs");
    expect(presenceLocationLabel({ modality: "en_ligne" })).toBe("En ligne");
  });
});

describe("presenceFicheFilename", () => {
  it("préfixe FORMATEUR / STAGIAIRE", () => {
    expect(presenceFicheFilename("formateur", "Clara Brimmer", "FLI-260001")).toBe(
      "Fiche_presence_FORMATEUR_FLI-260001_2025.pdf"
    );
    expect(presenceFicheFilename("stagiaire", "Clara Brimmer", null)).toContain(
      "Fiche_presence_STAGIAIRE_"
    );
  });
});

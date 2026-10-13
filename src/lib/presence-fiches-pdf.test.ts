import { describe, expect, it } from "vitest";
import {
  FLI_PRESENCE_FOOTER_LINES,
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

describe("FLI_PRESENCE_FOOTER_LINES", () => {
  it("reprend le pied de page FLI (capture Paula)", () => {
    expect(FLI_PRESENCE_FOOTER_LINES[0]).toContain("Formation Professionnelle Continue");
    expect(FLI_PRESENCE_FOOTER_LINES[1]).toContain("F.L.I.");
    expect(FLI_PRESENCE_FOOTER_LINES[1]).toContain("Montmélian");
    expect(FLI_PRESENCE_FOOTER_LINES[2]).toContain("484 772 041 00048");
    expect(FLI_PRESENCE_FOOTER_LINES[2]).toContain("82 73 01 366 73");
  });
});

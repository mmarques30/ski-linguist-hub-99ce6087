import { describe, expect, it } from "vitest";
import {
  ALPE_DHUEZ_CORRESPONDANCE,
  SCORE_TO_LEVEL_20,
  alpeDhuezFromScore20,
  getScoringSystem,
  scoreToLevel,
} from "./evaluation-utils";

describe("tableau de correspondance Alpe d'Huez /20", () => {
  it("couvre 0–20 sans trou sur les demi-points", () => {
    for (let i = 0; i <= 40; i++) {
      const score = i / 2;
      const band = alpeDhuezFromScore20(score);
      expect(band.cecrl).toBeTruthy();
      expect(SCORE_TO_LEVEL_20[score]).toBe(band.cecrl);
      expect(scoreToLevel(score, "sur_20")).toBe(band.cecrl);
    }
  });

  it("respecte les bornes du tableau Paula (ÉVEIL → MAÎTRISE)", () => {
    expect(alpeDhuezFromScore20(0)).toMatchObject({
      cecrl: "A1",
      keyword: "ÉVEIL",
      qualifier: "Débutant complet",
    });
    expect(alpeDhuezFromScore20(2)).toMatchObject({
      cecrl: "A1+",
      keyword: "ÉVEIL",
      qualifier: "Débutant avec notions",
    });
    expect(alpeDhuezFromScore20(3)).toMatchObject({ cecrl: "A1+", niveau: 0 });
    expect(alpeDhuezFromScore20(3.5)).toMatchObject({
      cecrl: "A2",
      keyword: "SURVIE",
      qualifier: "Très faible",
    });
    expect(alpeDhuezFromScore20(6)).toMatchObject({
      cecrl: "A2+",
      qualifier: "Faible",
    });
    expect(alpeDhuezFromScore20(8)).toMatchObject({
      cecrl: "B1",
      keyword: "AUTONOMIE",
    });
    expect(alpeDhuezFromScore20(9.5)).toMatchObject({ cecrl: "B1+" });
    expect(alpeDhuezFromScore20(10)).toMatchObject({
      cecrl: "B2",
      keyword: "OPÉRATIONNEL",
      qualifier: "Moyen",
    });
    expect(alpeDhuezFromScore20(11.5)).toMatchObject({
      cecrl: "B2",
      qualifier: "Moyen",
    });
    expect(alpeDhuezFromScore20(12)).toMatchObject({
      cecrl: "B2+",
      qualifier: "Moyen confirmé",
    });
    expect(alpeDhuezFromScore20(14)).toMatchObject({
      cecrl: "C1",
      keyword: "FLUIDITÉ",
      qualifier: "Bon",
    });
    expect(alpeDhuezFromScore20(16)).toMatchObject({
      cecrl: "C1+",
      qualifier: "Très bon",
    });
    expect(alpeDhuezFromScore20(18)).toMatchObject({
      cecrl: "C2",
      keyword: "MAÎTRISE",
      qualifier: "Excellent",
    });
    expect(alpeDhuezFromScore20(20)).toMatchObject({ cecrl: "C2", niveau: 5 });
  });

  it("classe Maelys Pietri (+0,5) en B2 Moyen / OPÉRATIONNEL", () => {
    for (const score of [10.5, 10.5, 10.5, 10, 11.5, 10.5]) {
      const band = alpeDhuezFromScore20(score);
      expect(band.cecrl).toBe("B2");
      expect(band.qualifier).toBe("Moyen");
      expect(band.niveau).toBe(3);
    }
  });

  it("détecte Alpe d'Huez et Villard Reculas en sur_20", () => {
    expect(getScoringSystem("ESF ALPE D'HUEZ (L')")).toBe("sur_20");
    expect(getScoringSystem("ESF Villard Reculas")).toBe("sur_20");
    expect(getScoringSystem("ESF Courchevel 1550")).toBe("sur_5");
  });

  it("expose 11 bandes de correspondance", () => {
    expect(ALPE_DHUEZ_CORRESPONDANCE).toHaveLength(11);
  });
});

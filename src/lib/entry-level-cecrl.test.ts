import { describe, expect, it } from "vitest";
import {
  classifyEntryLevelSource,
  mapEntryLevelToCecrl,
  normalizeEntryLevelSource,
  replaceMisdecodedEAcute,
} from "./entry-level-cecrl";

describe("BL-002 entry_level → CECRL", () => {
  it("laisse NULL vide", () => {
    expect(mapEntryLevelToCecrl(null)).toBeNull();
    expect(mapEntryLevelToCecrl("")).toBeNull();
    expect(mapEntryLevelToCecrl("   ")).toBeNull();
  });

  it("conserve un CECRL déjà saisi", () => {
    expect(mapEntryLevelToCecrl("A1")).toBe("A1");
    expect(mapEntryLevelToCecrl("a2")).toBe("A2");
    expect(mapEntryLevelToCecrl("B1+")).toBe("B1");
  });

  it("mappe la table validée (casse, faute, espace, U+008E)", () => {
    expect(mapEntryLevelToCecrl("Intermediaire")).toBe("B1");
    expect(mapEntryLevelToCecrl("Interm\u008Ediaire")).toBe("B1");
    expect(mapEntryLevelToCecrl("Perfeccionement ")).toBe("B2");
    expect(mapEntryLevelToCecrl("D\u008Ebutant")).toBe("A1");
    expect(mapEntryLevelToCecrl("Débutant")).toBe("A1");
    expect(mapEntryLevelToCecrl("Faux d\u008Ebutant")).toBe("A2");
    expect(mapEntryLevelToCecrl("Faux débutant")).toBe("A2");
    expect(mapEntryLevelToCecrl("1 - A2")).toBe("A2");
  });

  it("suit l'échelle numérotée de l'ancien tableur", () => {
    expect(mapEntryLevelToCecrl("1 - A2")).toBe("A2");
    expect(mapEntryLevelToCecrl("1-a2")).toBe("A2");
    expect(mapEntryLevelToCecrl("2 - B1")).toBe("B1");
    expect(mapEntryLevelToCecrl("3 - B2")).toBe("B2");
    expect(mapEntryLevelToCecrl("4 - C1+")).toBe("C1");
    expect(classifyEntryLevelSource("2 - B1")).toBe("prefixe_numerique");
    expect(classifyEntryLevelSource("1 - A2")).toBe("1_a2");
  });

  it("ne lit pas un numéro comme un niveau", () => {
    expect(mapEntryLevelToCecrl("2 - stage déjà effectué")).toBeNull();
    expect(mapEntryLevelToCecrl("stage déjà effectué 2 fois")).toBeNull();
    expect(
      mapEntryLevelToCecrl(
        "1 semaine de stage deja fait je me débrouille pour communiquer"
      )
    ).toBeNull();
    expect(mapEntryLevelToCecrl("Jamais evaluer mais fais plusieurs stage")).toBeNull();
  });

  it("ne prend pas « débutante » pour A1 (phrases libres)", () => {
    expect(
      mapEntryLevelToCecrl('Débutante ! je n\'ai jamais "pratiqué" cette langue')
    ).toBeNull();
    expect(
      mapEntryLevelToCecrl(
        "Je suis débutante en néerlandais, je n'ai jamais pratiqué."
      )
    ).toBeNull();
  });

  it("vide auto-positionnement / n/a / non évalué", () => {
    expect(mapEntryLevelToCecrl("Je n'ai jamais été évalué(e)")).toBeNull();
    expect(mapEntryLevelToCecrl("n/a")).toBeNull();
    expect(mapEntryLevelToCecrl("Je ne connais pas mon niveau")).toBeNull();
    expect(mapEntryLevelToCecrl("jamais pratiqué")).toBeNull();
    expect(
      mapEntryLevelToCecrl(
        "fais un stage l'an passé, prêt à refaire une évaluation"
      )
    ).toBeNull();
  });

  it("n'écrit jamais un libellé piste", () => {
    expect(mapEntryLevelToCecrl("Piste bleue")).toBeNull();
    expect(mapEntryLevelToCecrl("Début de parcours")).toBeNull();
  });

  it("classe les sources pour le journal (sans PII)", () => {
    expect(classifyEntryLevelSource(null)).toBe("null");
    expect(classifyEntryLevelSource("Intermediaire")).toBe("intermediaire");
    expect(classifyEntryLevelSource("A1")).toBe("already_a1");
    expect(classifyEntryLevelSource("n/a")).toBe("n_a");
    expect(classifyEntryLevelSource("phrase entière hors table")).toBe(
      "phrase_libre"
    );
  });

  it("normalise U+008E avant le mapping", () => {
    expect(replaceMisdecodedEAcute("D\u008Ebutant")).toBe("Débutant");
    expect(normalizeEntryLevelSource("Faux d\u008Ebutant")).toBe("faux debutant");
  });
});

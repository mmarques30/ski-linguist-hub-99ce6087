import { describe, expect, it } from "vitest";
import {
  listStructureMotifs,
  structureAllowsValidation,
} from "./evaluation-structure";

const base = {
  bloc_introduction: "Vous vous présentez clairement.",
  bloc_comprehension: "Vous comprenez les consignes.",
  bloc_technique: "Votre vocabulaire technique est adapté.",
  bloc_conclusion: "Vous pouvez conclure un échange.",
  score_comprehension: 3,
  score_expression: 3,
  score_structure: 3,
  score_technique: 3,
  score_conversation: 3,
  score_general: 3,
  score_general_calcule: 3,
  note_methodologique: null,
  cecrl_label: "B2",
};

describe("motifs de structure", () => {
  it("accepte un compte-rendu complet vouvoyé", () => {
    const motifs = listStructureMotifs(base);
    expect(structureAllowsValidation(motifs)).toBe(true);
  });

  it("liste les blocs manquants et le tutoiement", () => {
    const motifs = listStructureMotifs({
      ...base,
      bloc_conclusion: "",
      bloc_technique: "Tu dois revoir ta technique.",
    });
    expect(motifs.find((m) => m.id === "blocs")?.ok).toBe(false);
    expect(motifs.find((m) => m.id === "vouvoiement")?.ok).toBe(false);
    expect(structureAllowsValidation(motifs)).toBe(false);
  });

  it("exige la note méthodologique dès qu'il y a un écart", () => {
    const without = listStructureMotifs({
      ...base,
      score_general: 4,
      note_methodologique: null,
    });
    expect(without.find((m) => m.id === "methodo")?.ok).toBe(false);
    const withNote = listStructureMotifs({
      ...base,
      score_general: 4,
      note_methodologique: "Conversation plus solide que la moyenne.",
    });
    expect(withNote.find((m) => m.id === "methodo")?.ok).toBe(true);
    expect(withNote.find((m) => m.id === "ecart")?.ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  deriveEntryCertificateFields,
  deriveExitCertificateFields,
  formatFormateurLevelDisplay,
  isFormulaireEntreeComplete,
  isFormulaireSortieComplete,
  MONTAINE_FORMULAIRE_ENTREE,
  MONTAINE_FORMULAIRE_SORTIE,
  normalizeObjectifAtteint,
} from "./formateur-formation-forms";
import { canIssueCertificate } from "./certificate-progression";

describe("formateur-formation-forms", () => {
  it("maps Montaine entry Google Form to certificate synthesis", () => {
    expect(isFormulaireEntreeComplete(MONTAINE_FORMULAIRE_ENTREE)).toBe(true);
    const derived = deriveEntryCertificateFields(MONTAINE_FORMULAIRE_ENTREE);
    expect(derived.niveau_general_entree).toBe("B1+");
    expect(derived.niveau_technique_entree).toBe("B1");
    expect(derived.remarques_entree).toContain("Obtenir le niveau B2");
    expect(derived.remarques_entree).toContain("Teams");
  });

  it("maps Montaine exit Google Form to certificate-ready fields", () => {
    expect(isFormulaireSortieComplete(MONTAINE_FORMULAIRE_SORTIE)).toBe(true);
    const derived = deriveExitCertificateFields(MONTAINE_FORMULAIRE_SORTIE);
    expect(derived.niveau_general_sortie).toBe("B2");
    expect(derived.niveau_technique_sortie).toBe("B2");
    expect(derived.objectif_atteint).toBe("oui");
    expect(derived.commentaire_sortie).toContain("Très assidue");
    expect(canIssueCertificate(derived)).toBe(true);
  });

  it("normalizes Oui/Non from Google Forms", () => {
    expect(normalizeObjectifAtteint("Oui")).toBe("oui");
    expect(normalizeObjectifAtteint("Non")).toBe("non");
    expect(normalizeObjectifAtteint("Partiellement")).toBe("partiellement");
  });

  it("keeps CECRL formateur levels visible (no piste remapping)", () => {
    expect(formatFormateurLevelDisplay("B1+")).toBe("B1+");
    expect(formatFormateurLevelDisplay("B2")).toBe("B2");
    expect(formatFormateurLevelDisplay("Piste bleue")).toBe("Piste bleue");
  });
});

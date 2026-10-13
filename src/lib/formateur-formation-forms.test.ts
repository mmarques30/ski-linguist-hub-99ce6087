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
  resolveFormulaireEntree,
  resolveFormulaireSortie,
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

  it("réhydrate l'entrée depuis les colonnes plates si JSONB absent", () => {
    const form = resolveFormulaireEntree(null, {
      niveau_general_entree: "B1+",
      niveau_technique_entree: "B1",
      remarques_entree: "Objectif B2",
    });
    expect(form.source).toBe("legacy_flat");
    expect(form.expression_orale).toBe("B1+");
    expect(form.connaissances_grammaticales).toBe("B1");
    expect(form.attentes_stagiaire).toBe("Objectif B2");
    const derived = deriveEntryCertificateFields(form);
    expect(derived.niveau_general_entree).toBe("B1+");
    expect(derived.niveau_technique_entree).toBe("B1");
  });

  it("réhydrate la sortie depuis les colonnes plates si JSONB absent", () => {
    const form = resolveFormulaireSortie(null, {
      niveau_general_sortie: "B2",
      niveau_technique_sortie: "B2",
      objectif_atteint: "Oui",
      commentaire_sortie: "Très assidue",
    });
    expect(form.source).toBe("legacy_flat");
    expect(form.niveau_general).toBe("B2");
    expect(form.niveau_specifique).toBe("B2");
    expect(form.objectif_atteint).toBe("oui");
    expect(form.commentaire_assiduite).toBe("Très assidue");
    expect(isFormulaireSortieComplete(form)).toBe(true);
  });

  it("préfère le JSONB v1 aux colonnes plates", () => {
    const form = resolveFormulaireSortie(MONTAINE_FORMULAIRE_SORTIE, {
      niveau_general_sortie: "A1",
      niveau_technique_sortie: "A1",
      objectif_atteint: "non",
      commentaire_sortie: "legacy",
    });
    expect(form.niveau_general).toBe("B2");
    expect(form.source).toBe("google_form");
  });
});

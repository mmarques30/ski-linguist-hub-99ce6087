import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deriveEntryCertificateFields,
  deriveExitCertificateFields,
  emptyFormulaireEntree,
  emptyFormulaireSortie,
  FORMATEUR_CECRL_LEVELS,
  FORMATEUR_SKILL_UNEVALUATED,
  formatFormateurLevelDisplay,
  isFormulaireEntreeComplete,
  isFormulaireSortieComplete,
  isUnevaluatedSkillLevel,
  MONTAINE_FORMULAIRE_ENTREE,
  MONTAINE_FORMULAIRE_SORTIE,
  normalizeObjectifAtteint,
  resolveFormulaireEntree,
  resolveFormulaireSortie,
  usableCecrlSkillLevel,
} from "./formateur-formation-forms";
import { canIssueCertificate, CECRL_LEVELS } from "./certificate-progression";

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

  it("exige logistique en individuel et dynamique de groupe en collectif (PDF Google)", () => {
    const base = emptyFormulaireSortie({
      niveau_general: "B1",
      niveau_specifique: "B1",
      objectif_atteint: "oui",
      commentaire_assiduite: "OK",
    });
    expect(isFormulaireSortieComplete(base)).toBe(false);
    expect(
      isFormulaireSortieComplete({
        ...base,
        commentaire_logistique: "Salle OK",
      })
    ).toBe(true);

    const collectif = emptyFormulaireSortie({
      type_formation: "collective",
      niveau_general: "B1",
      niveau_specifique: "B1",
      objectif_atteint: "oui",
      niveau_general_groupe: "B1",
    });
    expect(isFormulaireSortieComplete(collectif)).toBe(false);
    expect(
      isFormulaireSortieComplete({
        ...collectif,
        commentaire_dynamique_groupe: "Bonne cohésion",
      })
    ).toBe(true);
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
    // PDF Google : logistique obligatoire en individuel — à compléter à la reprise
    expect(isFormulaireSortieComplete(form)).toBe(false);
    expect(
      isFormulaireSortieComplete({
        ...form,
        commentaire_logistique: "Moyens OK",
      })
    ).toBe(true);
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

  it("aligne l'échelle Google Forms (C1+ + Non évaluée)", () => {
    expect(CECRL_LEVELS).toContain("C1+");
    expect(FORMATEUR_CECRL_LEVELS).toContain("C1+");
    expect(isUnevaluatedSkillLevel(FORMATEUR_SKILL_UNEVALUATED)).toBe(true);
    expect(
      isUnevaluatedSkillLevel("Cette compétance n'a pas été évaluée")
    ).toBe(true);
    expect(usableCecrlSkillLevel(FORMATEUR_SKILL_UNEVALUATED)).toBeNull();
    expect(usableCecrlSkillLevel("B1+")).toBe("B1+");
  });

  it("refuse une entrée où toutes les compétences sont Non évaluée", () => {
    const form = emptyFormulaireEntree({
      type_formation: "individuelle",
      comprehension_ecrite: FORMATEUR_SKILL_UNEVALUATED,
      comprehension_orale: FORMATEUR_SKILL_UNEVALUATED,
      expression_ecrite: FORMATEUR_SKILL_UNEVALUATED,
      expression_orale: FORMATEUR_SKILL_UNEVALUATED,
      connaissances_grammaticales: FORMATEUR_SKILL_UNEVALUATED,
      attentes_stagiaire: "x",
      competences_a_developper: "y",
      themes_a_travailler: "z",
      adequation_moyens: "ok",
    });
    expect(isFormulaireEntreeComplete(form)).toBe(false);
  });

  it("App et layout exposent /formateur/bilans", () => {
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain('path="/formateur/bilans"');
    expect(app).toContain("FormateurBilans");
    expect(app).toContain("FormateurBilanFormPage");
    const layout = readFileSync(
      join(process.cwd(), "src/components/layout/FormateurLayout.tsx"),
      "utf8"
    );
    expect(layout).toContain("bilans");
    const mig = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261021150000_formateur_save_formation_forms.sql"
      ),
      "utf8"
    );
    expect(mig).toContain("save_formateur_formation_form");
  });
});

import { describe, expect, it } from "vitest";
import type { FormateurInscriptionRow } from "./formateur-portal";
import {
  areStagiairesNiveauxComplete,
  buildNiveauxFromCohort,
  cohortInscriptionsFor,
  isStagiaireNiveauRowComplete,
} from "./formateur-stagiaire-niveaux";

function row(
  partial: Partial<FormateurInscriptionRow> & { id: string }
): FormateurInscriptionRow {
  return {
    code: null,
    language: "anglais",
    start_date: "2026-12-01",
    end_date: "2026-12-05",
    status: "en_cours",
    student_id: partial.id,
    student_name: "Stagiaire",
    student_email: null,
    student_phone: null,
    course_location: "Méribel",
    course_address: null,
    modality: null,
    rhythm: null,
    schedule: null,
    group_name: null,
    ski_school_name: null,
    ...partial,
  };
}

describe("formateur-stagiaire-niveaux", () => {
  it("regroupe les missions de la même session", () => {
    const a = row({ id: "1", student_name: "Ada", group_name: "G1" });
    const b = row({ id: "2", student_name: "Bob", group_name: "G1" });
    const c = row({
      id: "3",
      student_name: "Cara",
      group_name: "Autre",
      course_location: "Val",
    });
    const cohort = cohortInscriptionsFor(a, [a, b, c]);
    expect(cohort.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });

  it("exige général + technique pour chaque stagiaire", () => {
    expect(
      isStagiaireNiveauRowComplete({
        inscription_id: "1",
        student_id: null,
        student_name: "Ada",
        niveau_general: "B1",
        niveau_technique: "A2",
      })
    ).toBe(true);
    expect(
      areStagiairesNiveauxComplete([
        {
          inscription_id: "1",
          student_id: null,
          student_name: "Ada",
          niveau_general: "B1",
          niveau_technique: null,
        },
      ])
    ).toBe(false);
  });

  it("hydrate les niveaux depuis les inscriptions", () => {
    const a = row({
      id: "1",
      student_name: "Ada",
      niveau_general_entree: "A2",
      niveau_technique_entree: "A1+",
    });
    const built = buildNiveauxFromCohort([a], "entree");
    expect(built[0]?.niveau_general).toBe("A2");
    expect(built[0]?.niveau_technique).toBe("A1+");
  });
});

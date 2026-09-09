import { describe, expect, it } from "vitest";
import {
  canIssueCertificate,
  isEntryFormComplete,
  isExitFormComplete,
  legacyLevelSyncFromProgression,
  listMissingFormationDocuments,
  CERTIFICATE_SNMSF_DISCLAIMER,
} from "./certificate-progression";

describe("certificate-progression", () => {
  it("requires both entry levels for entry form", () => {
    expect(
      isEntryFormComplete({
        niveau_general_entree: "Piste bleue",
        niveau_technique_entree: null,
        remarques_entree: "ok",
      })
    ).toBe(false);
    expect(
      isEntryFormComplete({
        niveau_general_entree: "Piste bleue",
        niveau_technique_entree: "Observation métier",
        remarques_entree: null,
      })
    ).toBe(true);
  });

  it("requires full exit form before certificate", () => {
    const incomplete = {
      niveau_general_sortie: "B1",
      niveau_technique_sortie: "A2",
      objectif_atteint: "oui",
      commentaire_sortie: "",
    };
    expect(isExitFormComplete(incomplete)).toBe(false);
    expect(canIssueCertificate(incomplete)).toBe(false);

    const complete = {
      ...incomplete,
      commentaire_sortie: "Objectifs atteints sur le terrain.",
    };
    expect(isExitFormComplete(complete)).toBe(true);
    expect(canIssueCertificate(complete)).toBe(true);
  });

  it("lists missing documents including sortie when expected", () => {
    const missing = listMissingFormationDocuments({
      entryFormComplete: true,
      exitFormComplete: false,
      hasCertificate: false,
      expectExitDocuments: true,
    });
    expect(missing.map((m) => m.code)).toEqual(["FORMULAIRE_SORTIE"]);
  });

  it("escalates missing certificate after exit form", () => {
    const missing = listMissingFormationDocuments({
      entryFormComplete: true,
      exitFormComplete: true,
      hasCertificate: false,
      expectExitDocuments: true,
    });
    expect(missing.map((m) => m.code)).toEqual(["CERTIFICAT"]);
  });

  it("syncs legacy columns from progression", () => {
    const sync = legacyLevelSyncFromProgression({
      niveau_general_entree: "Piste verte",
      niveau_technique_entree: "Accueil client",
      remarques_entree: null,
      niveau_general_sortie: "B1",
      niveau_technique_sortie: "A2",
      objectif_atteint: "partiellement",
      commentaire_sortie: "Encore du vocabulaire piste.",
    });
    expect(sync.entry_level).toBe("Piste verte");
    expect(sync.exit_level).toBe("B1");
    expect(sync.final_general_level).toBe("B1");
    expect(sync.final_specific_level).toBe("A2");
    expect(sync.progression).toBe("Partiellement");
  });

  it("keeps the exact SNMSF disclaimer text", () => {
    expect(CERTIFICATE_SNMSF_DISCLAIMER).toContain("SNMSF");
    expect(CERTIFICATE_SNMSF_DISCLAIMER).toContain(
      "évalué de façon continue par votre formateur·rice"
    );
  });
});

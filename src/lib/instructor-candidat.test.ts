import { describe, expect, it } from "vitest";
import {
  activationConfirmDescription,
  candidatActivationGaps,
  STATUT_ADMINISTRATIF_PRESETS,
} from "./instructor-candidat";

describe("candidatActivationGaps", () => {
  it("signale tous les manques sur une fiche vide", () => {
    const gaps = candidatActivationGaps({});
    expect(gaps).toEqual([
      "e-mail manquant",
      "téléphone manquant",
      "aucune langue renseignée",
      "SIRET / statut fiscal non renseigné",
      "statut administratif non renseigné",
      "attestation de vigilance non renseignée",
    ]);
  });

  it("n'exige pas SIRET si un statut fiscal est présent", () => {
    const gaps = candidatActivationGaps({
      email: "a@b.c",
      phone: "06",
      languages: ["anglais"],
      tax_status: "auto_entrepreneur",
      statut_administratif: "à régulariser",
      vigilance_attestation_received_at: "2026-01-01",
    });
    expect(gaps).toEqual([]);
  });

  it("accepte une URL d'attestation sans date de réception", () => {
    const gaps = candidatActivationGaps({
      email: "a@b.c",
      phone: "06",
      languages: ["anglais"],
      siret: "123",
      statut_administratif: "dossier_complet",
      vigilance_attestation_url: "https://example.com/attestation.pdf",
    });
    expect(gaps).toEqual([]);
  });
});

describe("activationConfirmDescription", () => {
  it("décrit une activation sans manques", () => {
    expect(activationConfirmDescription([])).toContain("candidat·e à actif·ve");
    expect(activationConfirmDescription([])).toContain("affectée aux inscriptions");
  });

  it("liste les points à compléter", () => {
    const text = activationConfirmDescription(["e-mail manquant", "téléphone manquant"]);
    expect(text).toContain("e-mail manquant ; téléphone manquant");
  });
});

describe("STATUT_ADMINISTRATIF_PRESETS", () => {
  it("n'inclut pas les statuts RH actif/candidat/inactif", () => {
    const values = STATUT_ADMINISTRATIF_PRESETS.map((p) => p.value);
    expect(values).not.toContain("actif");
    expect(values).not.toContain("candidat");
    expect(values).not.toContain("inactif");
  });
});

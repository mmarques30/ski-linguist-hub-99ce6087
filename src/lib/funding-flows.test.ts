import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
  FUNDING_FLOWS,
  canAutoEnqueueInscriptionDocuments,
  confirmationNextStepsHtmlForFunding,
  dossierEmailSlugsForFunding,
  getFundingFlow,
  resolveFundingFlowKey,
  shouldEnqueueDocumentsAtSubmitWithoutPayment,
} from "./funding-flows";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("funding-flows — résolution des modalités", () => {
  it("mappe les libellés DB et clés formulaire", () => {
    expect(resolveFundingFlowKey("FIFPL")).toBe("fifpl");
    expect(resolveFundingFlowKey("fifpl")).toBe("fifpl");
    expect(resolveFundingFlowKey("AGEFICE")).toBe("agefice");
    expect(resolveFundingFlowKey("OPCO")).toBe("opco");
    expect(resolveFundingFlowKey("Entreprise")).toBe("company");
    expect(resolveFundingFlowKey("company")).toBe("company");
    expect(resolveFundingFlowKey("Autofinancement")).toBe("self");
    expect(resolveFundingFlowKey("self")).toBe("self");
    expect(resolveFundingFlowKey(null)).toBeNull();
    expect(resolveFundingFlowKey("inconnu")).toBeNull();
  });

  it("définit un flux distinct par modalité", () => {
    expect(Object.keys(FUNDING_FLOWS).sort()).toEqual([
      "agefice",
      "company",
      "fifpl",
      "opco",
      "self",
    ]);
    expect(FUNDING_FLOWS.fifpl.packId).toBe("fifpl");
    expect(FUNDING_FLOWS.agefice.packId).toBe("agefice");
    expect(FUNDING_FLOWS.self.packId).toBe("convention_programme");
    expect(FUNDING_FLOWS.opco.packId).toBeNull();
    expect(FUNDING_FLOWS.company.packId).toBeNull();
  });

  it("n'enfile le dossier auto qu'après dépôt pour FIFPL / AGEFICE / self", () => {
    expect(canAutoEnqueueInscriptionDocuments("FIFPL")).toBe(true);
    expect(canAutoEnqueueInscriptionDocuments("AGEFICE")).toBe(true);
    expect(canAutoEnqueueInscriptionDocuments("Autofinancement")).toBe(true);
    expect(canAutoEnqueueInscriptionDocuments("OPCO")).toBe(false);
    expect(canAutoEnqueueInscriptionDocuments("Entreprise")).toBe(false);
  });

  it("n'enfile jamais à la soumission sans paiement (OPCO manuel)", () => {
    expect(shouldEnqueueDocumentsAtSubmitWithoutPayment("OPCO")).toBe(false);
    expect(shouldEnqueueDocumentsAtSubmitWithoutPayment("FIFPL")).toBe(false);
    expect(shouldEnqueueDocumentsAtSubmitWithoutPayment("AGEFICE")).toBe(false);
    expect(shouldEnqueueDocumentsAtSubmitWithoutPayment("Entreprise")).toBe(false);
    expect(shouldEnqueueDocumentsAtSubmitWithoutPayment("Autofinancement")).toBe(
      false,
    );
  });

  it("choisit le slug e-mail dossier avec fallback historique", () => {
    expect(dossierEmailSlugsForFunding("FIFPL")).toEqual([
      "inscription_documents_fifpl",
      FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
    ]);
    expect(dossierEmailSlugsForFunding("AGEFICE")).toEqual([
      "inscription_documents_agefice",
      FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
    ]);
    expect(dossierEmailSlugsForFunding("Autofinancement")).toEqual([
      "inscription_documents_self",
      FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
    ]);
    expect(dossierEmailSlugsForFunding("Entreprise")).toEqual([
      FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG,
    ]);
  });

  it("injecte des prochaines étapes distinctes par financement", () => {
    const fifpl = confirmationNextStepsHtmlForFunding("FIFPL");
    const agefice = confirmationNextStepsHtmlForFunding("AGEFICE");
    const opco = confirmationNextStepsHtmlForFunding("OPCO");
    const company = confirmationNextStepsHtmlForFunding("Entreprise");
    const self = confirmationNextStepsHtmlForFunding("Autofinancement");

    expect(fifpl).toContain("FIF-PL");
    expect(fifpl).not.toContain("AGEFICE");
    expect(agefice).toContain("AGEFICE");
    expect(agefice).not.toContain("FIF-PL");
    expect(opco).toContain("aucun règlement");
    expect(opco).not.toContain("150");
    expect(company).toContain("entreprise");
    expect(self).toContain("convention");
    expect(self).not.toContain("FIF-PL");
    expect(self).not.toContain("AGEFICE");
  });

  it("expose getFundingFlow pour le BO / resolve pack", () => {
    expect(getFundingFlow("AGEFICE")?.shortLabel).toBe("AGEFICE");
    expect(getFundingFlow("FIFPL")?.documentTrigger).toBe("after_deposit");
    expect(getFundingFlow("OPCO")?.documentTrigger).toBe("manual");
    expect(getFundingFlow("Entreprise")?.documentTrigger).toBe("none");
  });
});

describe("funding-flows — copie Deno", () => {
  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/funding-flows.ts");
    const deno = source("supabase/functions/_shared/funding-flows.ts");

    for (const symbol of [
      "FUNDING_FLOWS",
      "resolveFundingFlowKey",
      "getFundingFlow",
      "canAutoEnqueueInscriptionDocuments",
      "shouldEnqueueDocumentsAtSubmitWithoutPayment",
      "dossierEmailSlugsForFunding",
      "confirmationNextStepsHtmlForFunding",
      "FUNDING_DOSSIER_EMAIL_FALLBACK_SLUG",
    ]) {
      expect(front).toContain(symbol);
      expect(deno).toContain(symbol);
    }

    expect(front).toContain('dossierEmailSlug: "inscription_documents_fifpl"');
    expect(deno).toContain('dossierEmailSlug: "inscription_documents_fifpl"');
    expect(front).toContain('dossierEmailSlug: "inscription_documents_agefice"');
    expect(deno).toContain('dossierEmailSlug: "inscription_documents_agefice"');
    expect(front).toContain('packId: "convention_programme"');
    expect(deno).toContain('packId: "convention_programme"');
    expect(front).toContain("autoEnqueueAtSubmitWithoutPayment: false");
    expect(deno).toContain("autoEnqueueAtSubmitWithoutPayment: false");
  });
});

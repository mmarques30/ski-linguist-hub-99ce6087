import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isOpcoFunding,
  REGISTRATION_FUNDING_MAP,
} from "./registration-utils";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-027 — FIFPL et OPCO séparés", () => {
  it("REGISTRATION_FUNDING_MAP distingue fifpl et opco", () => {
    expect(REGISTRATION_FUNDING_MAP.fifpl).toBe("FIFPL");
    expect(REGISTRATION_FUNDING_MAP.opco).toBe("OPCO");
    expect(REGISTRATION_FUNDING_MAP.company).toBe("Entreprise");
    expect(REGISTRATION_FUNDING_MAP.self).toBe("Autofinancement");
  });

  it("isOpcoFunding ne cible que opco", () => {
    expect(isOpcoFunding("opco")).toBe(true);
    expect(isOpcoFunding("fifpl")).toBe(false);
    expect(isOpcoFunding("company")).toBe(false);
  });

  it("PaymentStep saute les options de paiement pour OPCO", () => {
    const paymentStep = source("src/components/registration/PaymentStep.tsx");
    expect(paymentStep).toContain('from "@/lib/registration-utils"');
    expect(paymentStep).toContain("isOpcoFunding");
    expect(paymentStep).toMatch(/if \(isOpco\)/);
    expect(paymentStep).toContain("paymentOption: undefined");
    expect(paymentStep).toContain("OPCO_REGISTER_COPY");
    expect(paymentStep).toContain("validateOpcoQuestionnaire");
    expect(paymentStep).toContain("opcoKnowsOpco");
  });

  it("ConfirmationStep traite OPCO comme sans paiement", () => {
    const confirmation = source("src/components/registration/ConfirmationStep.tsx");
    expect(confirmation).toContain("isOpcoFunding");
    expect(confirmation).toContain("REGISTRATION_FUNDING_MAP");
    expect(confirmation).toMatch(/hasPaymentStep = .*!isOpco/);
    expect(confirmation).toContain("OPCO_REGISTER_COPY");
  });

  it("submit-registration ignore paiement et inserts pour OPCO", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain('fifpl: "FIFPL"');
    expect(edge).toContain('opco: "OPCO"');
    expect(edge).toContain("isOpcoFunding");
    expect(edge).toMatch(/!isOpco &&/);
    expect(edge).toContain("funding_details");
    expect(edge).toContain("OPCO à analyser");
    expect(edge).toContain("formatOpcoObservation");
  });

  it("CourseSelectionStep affiche le texte OPCO validé", () => {
    const step = source("src/components/registration/CourseSelectionStep.tsx");
    expect(step).toContain("votre dossier sera étudié par FLI");
    expect(step).toContain("Aucun frais");
    expect(step).toContain("ne sera facturé pour le moment");
  });

  it("le back-office expose financement et propositions", () => {
    const card = source("src/components/inscriptions/InscriptionFundingCard.tsx");
    expect(card).toContain("useCreateFundingProposal");
    expect(card).toContain("PROPOSAL_PAYER_TYPES");
    expect(card).toContain("Mode de financement");
    const details = source("src/pages/inscriptions/InscriptionDetails.tsx");
    expect(details).toContain("InscriptionFundingCard");
    expect(details).toContain("funding_organization");
  });
});

describe("BL-038 — signaux qualité partenaires", () => {
  it("partner-name-quality expose les détecteurs et libellés", () => {
    const lib = source("src/lib/partner-name-quality.ts");
    expect(lib).toContain("looksLikeEmailName");
    expect(lib).toContain("startsWithAttention");
    expect(lib).toContain("partnerNeedsReview");
    expect(lib).toContain("partnerReviewReasons");
    expect(lib).toContain("partnerReviewLabel");
    expect(lib).toContain("buildPartnerNeedsReviewFilter");
  });

  it("usePartners filtre needsReview via PostgREST .or()", () => {
    const hook = source("src/hooks/usePartners.ts");
    expect(hook).toContain("needsReview?: boolean");
    expect(hook).toContain("buildPartnerNeedsReviewFilter");
    expect(hook).toMatch(/if \(filters\?\.needsReview\)/);
  });

  it("PartnersList affiche le badge et le filtre Qualité", () => {
    const list = source("src/pages/partners/PartnersList.tsx");
    expect(list).toContain('from "@/lib/partner-name-quality"');
    expect(list).toContain("partnerNeedsReview");
    expect(list).toContain("À vérifier");
    expect(list).toContain('value="a_verifier"');
    expect(list).toContain("qualityFilter");
    expect(list).toContain("needsReview:");
  });

  it("PartnerDetails affiche badge et alerte douce", () => {
    const details = source("src/pages/partners/PartnerDetails.tsx");
    expect(details).toContain("partnerNeedsReview");
    expect(details).toContain("partnerReviewLabel");
    expect(details).toContain("Fiche à vérifier");
    expect(details).toContain("À vérifier");
  });
});

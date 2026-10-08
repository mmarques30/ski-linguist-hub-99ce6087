import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCUMENT_REMINDER_DELAY_MINUTES,
  qualifiesAsDepositConfirmation,
} from "./enqueue-inscription-documents";
import {
  canAutoEnqueueInscriptionDocuments,
  paymentTriggersDocumentEnqueue,
} from "./funding-flows";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("enqueue-inscription-documents — règles métier", () => {
  it("confirme l'acompte / total reçu, pas le solde chèque", () => {
    expect(
      qualifiesAsDepositConfirmation({
        status: "recu",
        amount: 150,
        payment_type: "acompte",
      })
    ).toBe(true);
    expect(
      qualifiesAsDepositConfirmation({
        status: "recu",
        amount: 950,
        payment_type: "total",
      })
    ).toBe(true);
    expect(
      qualifiesAsDepositConfirmation({
        status: "en_attente",
        amount: 150,
        payment_type: "acompte",
      })
    ).toBe(false);
    expect(
      qualifiesAsDepositConfirmation({
        status: "recu",
        amount: 800,
        payment_type: "partial",
      })
    ).toBe(false);
  });

  it("garde le délai +30 min aligné avec le cron", () => {
    expect(DOCUMENT_REMINDER_DELAY_MINUTES).toBe(30);
  });

  it("bloque l'enfilement auto pour OPCO et Entreprise", () => {
    expect(canAutoEnqueueInscriptionDocuments("OPCO")).toBe(false);
    expect(canAutoEnqueueInscriptionDocuments("Entreprise")).toBe(false);
    expect(canAutoEnqueueInscriptionDocuments("FIFPL")).toBe(true);
  });

  it("enfile le dossier autofinancement dès l'acompte 150 €", () => {
    expect(
      paymentTriggersDocumentEnqueue("Autofinancement", {
        status: "recu",
        amount: 150,
        payment_type: "acompte",
      }),
    ).toBe(true);
    expect(
      paymentTriggersDocumentEnqueue("Autofinancement", {
        status: "recu",
        amount: 1200,
        payment_type: "total",
      }),
    ).toBe(true);
  });
});

describe("enqueue-inscription-documents — copie Deno", () => {
  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/enqueue-inscription-documents.ts");
    const deno = source(
      "supabase/functions/_shared/enqueue-inscription-documents.ts"
    );

    for (const symbol of [
      "DOCUMENT_REMINDER_DELAY_MINUTES",
      "qualifiesAsDepositConfirmation",
      "enqueueInscriptionDocuments",
      "confirmDepositAndEnqueueDocuments",
      "canAutoEnqueueInscriptionDocuments",
      "paymentTriggersDocumentEnqueue",
    ]) {
      expect(front).toContain(symbol);
      expect(deno).toContain(symbol);
    }

    expect(front).toContain('status !== "recu"');
    expect(deno).toContain('status !== "recu"');
    expect(front).toContain('type !== "acompte"');
    expect(deno).toContain('type !== "acompte"');
    expect(front).toContain('.in("status", ["PENDING", "SENT"])');
    expect(deno).toContain('.in("status", ["PENDING", "SENT"])');
    expect(front).toContain("paymentTriggersDocumentEnqueue");
    expect(deno).toContain('from "./funding-flows.ts"');
  });
});

describe("dossier après acompte — points d'accroche", () => {
  it("n'envoie plus le dossier à la soumission quand un flux de paiement existe", () => {
    const submit = source("supabase/functions/submit-registration/index.ts");
    expect(submit).toContain("shouldEnqueueDocumentsAtSubmitWithoutPayment");
    expect(submit).toContain("enqueueInscriptionDocuments");
    expect(submit).toContain("funding_next_steps");
    expect(submit).toContain("confirmationNextStepsHtmlForFunding");
  });

  it("enfile le dossier après confirmation Stripe seulement si le paiement qualifie", () => {
    const stripe = source(
      "supabase/functions/_shared/record-stripe-checkout-payment.ts"
    );
    expect(stripe).toContain("enqueueInscriptionDocuments");
    expect(stripe).toContain("paymentTriggersDocumentEnqueue");
    expect(stripe).toContain("after Stripe");
  });

  it("propose « Marquer reçu » sur les paiements en attente (BO)", () => {
    const card = source(
      "src/components/inscriptions/InscriptionFinancialPayments.tsx"
    );
    expect(card).toContain("useMarkPaymentReceived");
    expect(card).toContain("Marquer reçu");
  });
});

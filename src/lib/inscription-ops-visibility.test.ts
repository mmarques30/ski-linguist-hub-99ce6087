import { describe, expect, it } from "vitest";
import {
  computePaymentSettlement,
  docsSentStatus,
  sumReceivedPayments,
} from "@/lib/inscription-ops-visibility";

describe("inscription-ops-visibility", () => {
  it("docsSentStatus", () => {
    expect(docsSentStatus(null)).toBe("a_envoyer");
    expect(docsSentStatus(undefined)).toBe("a_envoyer");
    expect(docsSentStatus("2026-11-02T12:00:00Z")).toBe("envoye");
  });

  it("computePaymentSettlement — soldé / partiel / à régler", () => {
    expect(computePaymentSettlement({ price: 900, receivedTotal: 0 })).toBe(
      "a_regler",
    );
    expect(computePaymentSettlement({ price: 900, receivedTotal: 150 })).toBe(
      "partiel",
    );
    expect(computePaymentSettlement({ price: 900, receivedTotal: 900 })).toBe(
      "solde",
    );
    expect(computePaymentSettlement({ price: 900, receivedTotal: 899.6 })).toBe(
      "solde",
    );
    expect(computePaymentSettlement({ price: null, receivedTotal: 0 })).toBe(
      "aucun",
    );
    expect(computePaymentSettlement({ price: null, receivedTotal: 100 })).toBe(
      "partiel",
    );
  });

  it("sumReceivedPayments ignore non-recu", () => {
    expect(
      sumReceivedPayments([
        { amount: 150, status: "recu" },
        { amount: 750, status: "en_attente" },
        { amount: 150, status: "annule" },
      ]),
    ).toBe(150);
  });
});

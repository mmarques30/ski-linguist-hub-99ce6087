import { describe, expect, it } from "vitest";
import {
  canonicalPaymentMethod,
  chequeStatusLabel,
  invoiceStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentTypeLabel,
} from "@/lib/payment-methods";

describe("payment-methods", () => {
  it("unifie les alias facture / paiement", () => {
    expect(canonicalPaymentMethod("carte")).toBe("cb");
    expect(canonicalPaymentMethod("carte_bancaire")).toBe("cb");
    expect(canonicalPaymentMethod("opco")).toBe("organisme");
    expect(canonicalPaymentMethod("virement")).toBe("virement");
  });

  it("affiche les libellés métier, jamais les codes bruts connus", () => {
    expect(paymentMethodLabel("cb")).toBe("Carte");
    expect(paymentMethodLabel("historique")).toBe("Non renseigné (historique)");
    expect(invoiceStatusLabel("draft")).toBe("Brouillon");
    expect(invoiceStatusLabel("a_verifier")).toBe("À vérifier");
    expect(chequeStatusLabel("encaisse")).toBe("Encaissé");
  });

  it("traduit les types de facture et de paiement, héritages inclus", () => {
    expect(paymentTypeLabel("integral")).toBe("Intégral");
    expect(paymentTypeLabel("acompte")).toBe("Acompte");
    expect(paymentTypeLabel("adiantamento")).toBe("Acompte");
    expect(paymentTypeLabel("saldo")).toBe("Solde");
    expect(paymentTypeLabel("total")).toBe("Total");
    expect(paymentTypeLabel(null)).toBe("—");
    expect(paymentStatusLabel("recu")).toBe("Reçu");
    expect(paymentStatusLabel("en_attente")).toBe("En attente");
  });
});

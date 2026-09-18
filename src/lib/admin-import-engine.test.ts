import { describe, expect, it } from "vitest";
import {
  IMPORT_HISTORIQUE_LIMITE,
  IMPORT_TABLE_LABELS,
  IMPORT_UPSERT_KEYS,
  prepareImport,
} from "@/lib/admin-import-engine";

/**
 * Point 9 — import des factures et paiements historiques.
 *
 * La règle métier : l'exercice fiscal FLI court d'octobre à septembre, et
 * l'exercice courant a commencé le 01/10/2025. Une pièce historique datée à
 * partir de ce jour se retrouverait dans l'exercice en cours et fausserait la
 * numérotation fiscale, d'où la barrière de date.
 */

const HIST = { historicalBefore: IMPORT_HISTORIQUE_LIMITE };

describe("barrière de date de l'import historique", () => {
  it("accepte une facture antérieure au 01/10/2025", () => {
    const r = prepareImport(
      [{ invoice_date: "15/08/2025", invoice_type: "formation", amount_ht: "1 200,50" }],
      "invoices",
      HIST,
    );
    expect(r.rejectedCount).toBe(0);
    expect(r.accepted[0]).toMatchObject({
      invoice_date: "2025-08-15",
      invoice_type: "formation",
      amount_ht: 1200.5,
      tva_rate: 0,
    });
  });

  it("refuse une facture du 01/10/2025, premier jour de l'exercice courant", () => {
    const r = prepareImport(
      [{ invoice_date: "01/10/2025", invoice_type: "formation", amount_ht: "100" }],
      "invoices",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("2025-10-01");
    expect(r.rejections[0].reason).toContain("import historique");
  });

  it("refuse une facture postérieure et indique sa ligne", () => {
    const r = prepareImport(
      [
        { invoice_date: "30/09/2025", invoice_type: "formation", amount_ht: "10" },
        { invoice_date: "05/01/2026", invoice_type: "formation", amount_ht: "20" },
      ],
      "invoices",
      HIST,
    );
    expect(r.acceptedCount).toBe(1);
    expect(r.rejections).toHaveLength(1);
    // en-tête = ligne 1, donc la deuxième ligne de données est la ligne 3
    expect(r.rejections[0].lineNumber).toBe(3);
  });

  it("laisse passer une date récente quand la barrière est levée", () => {
    const r = prepareImport(
      [{ invoice_date: "05/01/2026", invoice_type: "formation", amount_ht: "20" }],
      "invoices",
      {},
    );
    expect(r.rejectedCount).toBe(0);
  });

  it("refuse une date de paiement récente sur une facture ancienne", () => {
    const r = prepareImport(
      [
        {
          invoice_date: "15/08/2025",
          payment_date: "12/11/2025",
          invoice_type: "formation",
          amount_ht: "100",
        },
      ],
      "invoices",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("Date de paiement");
  });
});

describe("facture sans date", () => {
  it("rejette au lieu de retomber sur la date du jour", () => {
    const r = prepareImport(
      [{ invoice_type: "formation", amount_ht: "100" }],
      "invoices",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("invoice_date manquante");
  });
});

describe("import des paiements", () => {
  it("est proposé comme table cible", () => {
    expect(IMPORT_TABLE_LABELS.payments).toBe("payments (paiements)");
  });

  it("mappe un virement avec en-têtes françaises", () => {
    const r = prepareImport(
      [
        {
          "Date paiement": "03/04/2025",
          Montant: "1 450,00",
          "Mode de paiement": "Virement",
          Référence: "VIR-2025-0412",
          "Nom du payeur": "ESF Courchevel",
          Payeur: "esf",
        },
      ],
      "payments",
      HIST,
    );
    expect(r.rejectedCount).toBe(0);
    expect(r.accepted[0]).toMatchObject({
      payment_date: "2025-04-03",
      amount: 1450,
      payment_method: "virement",
      payment_type: "total",
      currency: "EUR",
      reference: "VIR-2025-0412",
      payer_type: "ecole",
      payer_name: "ESF Courchevel",
    });
  });

  it("normalise les modes et types acceptés par la base", () => {
    const r = prepareImport(
      [
        { payment_date: "01/02/2025", amount: "10", payment_method: "Chèque", payment_type: "acompte" },
        { payment_date: "02/02/2025", amount: "20", payment_method: "espèces", payment_type: "solde" },
        { payment_date: "03/02/2025", amount: "30", payment_method: "Carte bancaire", payment_type: "integral" },
      ],
      "payments",
      HIST,
    );
    expect(r.rejectedCount).toBe(0);
    expect(r.accepted.map((p) => [p.payment_method, p.payment_type])).toEqual([
      ["cheque", "acompte"],
      ["especes", "partial"],
      ["cb", "total"],
    ]);
  });

  it("refuse un mode de paiement hors contrainte", () => {
    const r = prepareImport(
      [{ payment_date: "01/02/2025", amount: "10", payment_method: "bitcoin" }],
      "payments",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("Mode de paiement invalide");
  });

  it("refuse un paiement sans date", () => {
    const r = prepareImport(
      [{ amount: "10", payment_method: "virement" }],
      "payments",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("payment_date manquante");
  });

  it("refuse un paiement sans montant", () => {
    const r = prepareImport(
      [{ payment_date: "01/02/2025", payment_method: "virement" }],
      "payments",
      HIST,
    );
    expect(r.acceptedCount).toBe(0);
    expect(r.rejections[0].reason).toContain("amount manquant");
  });
});

describe("IMPORT_UPSERT_KEYS", () => {
  it("utilise email comme clé naturelle pour students", () => {
    expect(IMPORT_UPSERT_KEYS.students).toBe("email");
  });
});

describe("import des leads", () => {
  it("accepte une ligne valide avec valeurs par défaut", () => {
    const r = prepareImport(
      [
        {
          contact_name: "Marie Dupont",
          contact_email: "marie@example.com",
          company: "ESF Test",
        },
      ],
      "leads",
    );
    expect(r.rejectedCount).toBe(0);
    expect(r.accepted[0]).toMatchObject({
      contact_name: "Marie Dupont",
      contact_email: "marie@example.com",
      company: "ESF Test",
      source: "autre",
      expansion_channel: "b2b",
      status: "nouveau",
    });
  });
});

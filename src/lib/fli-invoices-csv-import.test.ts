import { describe, expect, it } from "vitest";
import {
  EMPTY_PAYMENT_CUTOFF,
  HISTORICAL_SEQUENCE_GAP,
  applyEmptyPaymentRules,
  deduceInvoiceType,
  foldInvoiceText,
  matchFliInvoicesToInscriptions,
  parseFliInvoicesCsv,
  resolveEsfPartner,
  toInvoiceInsert,
  toPaymentInserts,
} from "@/lib/fli-invoices-csv-import";

const HEADER =
  "n°;BPF;BPF 2;Nom et Prénom;Civilité;Rue ou localité;CP;Ville;Email;Date Fact;n° seq;Année compt;Fact FLI;Qté;Désignation;Matière;Prix Unitaire HT;Déplacement / Hébergement;Certification;Total HT;TVA;Total TTC;Lieu du stage;Modalité;Langue;Durée (h);Date de début;Date de fin;Montant de l'acompte;Date de l'acompte;Moyen de paiement - Acompt;Moyen de paiement;N° Chèque;Banque;Date émiss chèque / virement;Niveau;Nive Technique;formateur;école de ski;e-mail école de ski;Commentaire Formateur";

function csv(lines: string[]): string {
  return `\uFEFF${[HEADER, ...lines].join("\n")}`;
}

function line(overrides: Record<string, string>): string {
  const cols: Record<string, string> = {
    "n°": "13010",
    BPF: "",
    "BPF 2": "",
    "Nom et Prénom": "Dupont Marie",
    Civilité: "",
    "Rue ou localité": "",
    CP: "",
    Ville: "",
    Email: "",
    "Date Fact": "2020-10-16",
    "n° seq": "13010",
    "Année compt": "20-21",
    "Fact FLI": "20-21.13010",
    Qté: "1",
    Désignation: "Stage d'anglais",
    Matière: "",
    "Prix Unitaire HT": "630",
    "Déplacement / Hébergement": "0",
    Certification: "0",
    "Total HT": "630",
    TVA: "0",
    "Total TTC": "630",
    "Lieu du stage": "",
    Modalité: "",
    Langue: "Anglais",
    "Durée (h)": "20",
    "Date de début": "2020-09-15",
    "Date de fin": "2020-10-15",
    "Montant de l'acompte": "",
    "Date de l'acompte": "",
    "Moyen de paiement - Acompt": "",
    "Moyen de paiement": "Virement",
    "N° Chèque": "",
    Banque: "",
    "Date émiss chèque / virement": "2020-10-20",
    Niveau: "",
    "Nive Technique": "",
    formateur: "",
    "école de ski": "",
    "e-mail école de ski": "",
    "Commentaire Formateur": "",
    ...overrides,
  };
  const order = HEADER.split(";");
  return order.map((h) => cols[h] ?? "").join(";");
}

describe("parseFliInvoicesCsv", () => {
  it("lit un UTF-8 BOM, conserve Fact FLI et totalise par exercice", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({}),
        line({
          "n°": "13011",
          "n° seq": "13011",
          "Fact FLI": "20-21.13011",
          "Total HT": "1 200,50",
          TVA: "0",
          "Total TTC": "1 200,50",
          "Moyen de paiement": "Chèque",
        }),
      ])
    );
    expect(preview.encodingNotes.some((n) => /BOM/i.test(n))).toBe(true);
    expect(preview.totalRows).toBe(2);
    expect(preview.rows[0].invoiceNumber).toBe("20-21.13010");
    expect(preview.rows[1].amountHt).toBe(1200.5);
    expect(preview.totalsByYear).toEqual([
      { year: "20-21", n: 2, ht: 1830.5, tva: 0, ttc: 1830.5 },
    ]);
    expect(preview.rows[0].invoiceStatus).toBe("paid");
    expect(preview.rows[0].paymentMethod).toBe("virement");
  });

  it("signale le trou 13288 sans le combler", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          "n°": "13287",
          "n° seq": "13287",
          "Année compt": "21-22",
          "Fact FLI": "21-22.13287",
          "Date Fact": "2021-12-10",
        }),
        line({
          "n°": "13289",
          "n° seq": "13289",
          "Année compt": "21-22",
          "Fact FLI": "21-22.13289",
          "Date Fact": "2021-12-12",
        }),
      ])
    );
    expect(preview.sequence.missing).toEqual([HISTORICAL_SEQUENCE_GAP]);
    expect(preview.sequence.knownGapPreserved).toBe(true);
  });

  it("classe avoir / annulée / à régler / vide", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({ "Moyen de paiement": "avoir", "Total HT": "-100", "Total TTC": "-100" }),
        line({
          "n° seq": "13011",
          "Fact FLI": "20-21.13011",
          "Moyen de paiement": "annulée",
        }),
        line({
          "n° seq": "13012",
          "Fact FLI": "20-21.13012",
          "Moyen de paiement": "à régler",
        }),
        line({
          "n° seq": "13013",
          "Fact FLI": "20-21.13013",
          "Moyen de paiement": "",
        }),
      ])
    );
    expect(preview.rows.map((r) => r.paymentKind)).toEqual([
      "credit",
      "cancelled",
      "unpaid",
      "historique",
    ]);
    expect(preview.rows.map((r) => r.invoiceStatus)).toEqual([
      "paid",
      "cancelled",
      "sent",
      "paid",
    ]);
    expect(preview.rows[0].paymentMethod).toBeNull();
    expect(preview.emptyPaymentMethods).toHaveLength(1);
    expect(preview.emptyPaymentMethods[0].resolution).toBe("historique");
    expect(preview.rows[3].paymentMethod).toBe("historique");
  });

  it("déduit formation / test / sous-traitance et signale les graphies", () => {
    expect(deduceInvoiceType("Stage d'anglais", 0).type).toBe("formation");
    expect(deduceInvoiceType("test d'anglais", 6.666).type).toBe("test");
    expect(deduceInvoiceType("Encadrement d'une formation pisteurs", 436.8).type).toBe(
      "soustraitance"
    );
    const typo = deduceInvoiceType("Tstes pour STBMA", 159.6);
    expect(typo.type).toBe("test");
    expect(typo.note).toMatch(/Graphie/i);
  });

  it("n'invente pas un numéro : toInvoiceInsert reprend Fact FLI", () => {
    const preview = parseFliInvoicesCsv(csv([line({})]));
    const insert = toInvoiceInsert(preview.rows[0], null);
    expect(insert.invoice_number).toBe("20-21.13010");
    expect(insert.sequence_number).toBe(13010);
    expect(insert.fiscal_year).toBe("20-21");
    expect(insert).not.toHaveProperty("amount_ttc");
    expect(String(insert.notes)).toContain("Dupont Marie");
  });

  it("classe « facturé à l'ESF » en payeur école", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          "Moyen de paiement": "facturé à l'ESF",
          "Lieu du stage": "La Rosière",
        }),
      ])
    );
    expect(preview.rows[0].paymentKind).toBe("esf");
    expect(preview.rows[0].clientType).toBe("ecole_ski");
    expect(preview.rows[0].invoiceStatus).toBe("sent");
    expect(preview.rows[0].location).toBe("La Rosière");
    expect(preview.esfBilled).toHaveLength(1);
  });
});

describe("matchFliInvoicesToInscriptions", () => {
  it("rattache par nom (ordre indifférent) + date de début + langue", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({ "Nom et Prénom": "Dupont Marie" }),
        line({
          "n° seq": "13011",
          "Fact FLI": "20-21.13011",
          "Nom et Prénom": "Inconnu ZZ",
        }),
      ])
    );
    const report = matchFliInvoicesToInscriptions(preview.rows, [
      {
        id: "aaa",
        code: "FLI-1",
        start_date: "2020-09-15",
        language: "Anglais",
        first_name: "Marie",
        last_name: "Dupont",
      },
    ]);
    expect(report.matched).toHaveLength(1);
    expect(report.matched[0].invoiceNumber).toBe("20-21.13010");
    expect(report.unmatched).toHaveLength(1);
    expect(report.unmatched[0].invoiceNumber).toBe("20-21.13011");
  });

  it("ne rattache pas si plusieurs inscriptions conviennent", () => {
    const preview = parseFliInvoicesCsv(csv([line({ "Nom et Prénom": "Martin Paul" })]));
    const report = matchFliInvoicesToInscriptions(preview.rows, [
      {
        id: "a",
        code: "1",
        start_date: "2020-09-15",
        language: "Anglais",
        first_name: "Paul",
        last_name: "Martin",
      },
      {
        id: "b",
        code: "2",
        start_date: "2020-09-15",
        language: "Anglais",
        first_name: "Paul",
        last_name: "Martin",
      },
    ]);
    expect(report.matched).toHaveLength(0);
    expect(report.ambiguous).toHaveLength(1);
  });

  it("aligne le portugais malgré les accents corrompus", () => {
    expect(foldInvoiceText("Portugais brésilien")).toContain("portugais");
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          Langue: "Portugais brésilien",
          "Nom et Prénom": "Silva Ana",
        }),
      ])
    );
    const report = matchFliInvoicesToInscriptions(preview.rows, [
      {
        id: "p",
        code: "X",
        start_date: "2020-09-15",
        language: "Portugais br\u008Esilien",
        first_name: "Ana",
        last_name: "Silva",
      },
    ]);
    expect(report.matched).toHaveLength(1);
  });
});

describe("resolveEsfPartner", () => {
  const partners = [
    {
      id: "rosiere",
      name: "ESF ROSIERE (LA)",
      type: "esf" as const,
      station: "rosiere la",
      esf_code: "548",
    },
    {
      id: "c1550",
      name: "ESF COURCHEVEL 1550",
      type: "esf" as const,
      station: "courchevel",
      esf_code: "302",
    },
    {
      id: "c1850",
      name: "ESF COURCHEVEL 1850",
      type: "esf" as const,
      station: "courchevel",
      esf_code: "308",
    },
  ];

  it("rattache La Rosière à l'unique ESF ROSIERE (LA)", () => {
    const partner = resolveEsfPartner("La Rosière", null, partners);
    expect(partner?.id).toBe("rosiere");
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          "Moyen de paiement": "facturé à l'ESF",
          "Lieu du stage": "La Rosière",
        }),
      ])
    );
    const insert = toInvoiceInsert(preview.rows[0], "insc", partner);
    expect(insert.client_type).toBe("ecole_ski");
    expect(String(insert.notes)).toMatch(/ESF ROSIERE \(LA\) \(548\)/);
  });

  it("ne choisit pas au hasard si plusieurs ESF partagent la station", () => {
    expect(resolveEsfPartner("Courchevel", null, partners)).toBeNull();
  });
});

describe("applyEmptyPaymentRules", () => {
  it("classe négatif → avoir, zéro/ERREUR → annulée, avant cut-off → historique, après → à vérifier", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          "Moyen de paiement": "",
          "Total HT": "-100",
          "Total TTC": "-100",
        }),
        line({
          "n° seq": "13011",
          "Fact FLI": "20-21.13011",
          "Moyen de paiement": "",
          "Total HT": "0",
          "Total TTC": "0",
        }),
        line({
          "n° seq": "13012",
          "Fact FLI": "20-21.13012",
          "Nom et Prénom": "_ERREUR_",
          "Moyen de paiement": "",
          "Total HT": "10",
          "Total TTC": "10",
        }),
        line({
          "n° seq": "13013",
          "Fact FLI": "20-21.13013",
          "Moyen de paiement": "",
          "Date Fact": "2025-06-30",
        }),
        line({
          "n° seq": "14000",
          "Année compt": "25-26",
          "Fact FLI": "25-26.14000",
          "Moyen de paiement": "",
          "Date Fact": "2025-07-01",
        }),
      ])
    );
    expect(preview.rows.map((r) => r.invoiceStatus)).toEqual([
      "paid",
      "cancelled",
      "cancelled",
      "paid",
      "a_verifier",
    ]);
    expect(preview.rows[3].paymentMethod).toBe("historique");
    expect(preview.toVerify).toHaveLength(1);
    expect(preview.toVerify[0].invoiceNumber).toBe("25-26.14000");
    expect(preview.caGrandTotal.ht).toBe(1160);
    expect(EMPTY_PAYMENT_CUTOFF).toBe("2025-07-01");
    expect(applyEmptyPaymentRules(preview.rows[4])).toBe("a_verifier");
  });

  it("crée un paiement même si la date d'émission est vide, via la date de facture", () => {
    const preview = parseFliInvoicesCsv(
      csv([
        line({
          "Date émiss chèque / virement": "",
        }),
      ])
    );
    const payments = toPaymentInserts(preview.rows[0], "insc");
    expect(payments).toHaveLength(1);
    expect(payments[0].payment_date).toBe("2020-10-16");
    expect(payments[0].payment_method).toBe("virement");
  });
});


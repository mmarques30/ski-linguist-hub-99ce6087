import { describe, expect, it } from "vitest";
import {
  buildSalesJournalCsv,
  buildSalesJournalRows,
  computeTvaAmount,
  formatJournalAmount,
  formatJournalDate,
  isIncludedInSalesJournal,
  resolveAmountTtc,
  resolveJournalLabel,
  salesJournalFilename,
  type SalesJournalInvoice,
} from "./sales-journal-export";

function sample(partial: Partial<SalesJournalInvoice> = {}): SalesJournalInvoice {
  return {
    invoice_number: "26-27.00100",
    invoice_date: "2026-08-15",
    due_date: "2026-09-15",
    invoice_type: "formation",
    client_type: "stagiaire",
    amount_ht: 1500,
    tva_rate: 0,
    amount_ttc: 1500,
    status: "paid",
    payment_date: "2026-08-20",
    payment_method: "virement",
    fiscal_year: "26-27",
    notes: null,
    inscription: {
      code: "INS-100",
      language: "anglais",
      student_name: "Dupont Marie",
    },
    ...partial,
  };
}

describe("sales-journal-export", () => {
  it("formate les dates et montants pour Excel FR", () => {
    expect(formatJournalDate("2026-08-15")).toBe("15/08/2026");
    expect(formatJournalDate(null)).toBe("");
    expect(formatJournalAmount(1500)).toBe("1500,00");
    expect(formatJournalAmount(12.5)).toBe("12,50");
  });

  it("calcule la TVA et le TTC", () => {
    expect(computeTvaAmount(100, 20)).toBe(20);
    expect(computeTvaAmount(100, 0)).toBe(0);
    expect(resolveAmountTtc(100, null, 20)).toBe(120);
    expect(resolveAmountTtc(100, 115, 20)).toBe(115);
  });

  it("exclut brouillons et annulées", () => {
    expect(isIncludedInSalesJournal("draft")).toBe(false);
    expect(isIncludedInSalesJournal("cancelled")).toBe(false);
    expect(isIncludedInSalesJournal("paid")).toBe(true);
    expect(isIncludedInSalesJournal("sent")).toBe(true);
  });

  it("trie par date puis n° et ignore les exclus", () => {
    const rows = buildSalesJournalRows([
      sample({ invoice_number: "26-27.00200", invoice_date: "2026-09-01", status: "sent" }),
      sample({ invoice_number: "26-27.00100", invoice_date: "2026-08-15", status: "draft" }),
      sample({ invoice_number: "26-27.00050", invoice_date: "2026-08-15", status: "paid" }),
      sample({ invoice_number: "26-27.00300", invoice_date: "2026-07-01", status: "cancelled" }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].invoiceNumber).toBe("26-27.00050");
    expect(rows[1].invoiceNumber).toBe("26-27.00200");
  });

  it("résout le libellé depuis notes, langue ou type", () => {
    expect(
      resolveJournalLabel(
        sample({ notes: "Dupont Marie — Stage intensif anglais" })
      )
    ).toBe("Stage intensif anglais");
    expect(resolveJournalLabel(sample())).toBe("Formation anglais");
    expect(resolveJournalLabel(sample({ invoice_type: "test", inscription: null }))).toBe(
      "Test de niveau"
    );
  });

  it("produit un CSV avec en-têtes, lignes et total", () => {
    const csv = buildSalesJournalCsv([
      sample(),
      sample({
        invoice_number: "26-27.00101",
        invoice_date: "2026-08-16",
        amount_ht: 500,
        amount_ttc: 500,
        status: "sent",
        payment_date: null,
        payment_method: null,
      }),
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Date;N° facture;Client");
    expect(lines).toHaveLength(4); // header + 2 lignes + total
    expect(lines[1]).toContain("15/08/2026");
    expect(lines[1]).toContain("Dupont Marie");
    expect(lines[1]).toContain("1500,00");
    expect(lines[3]).toContain("TOTAL");
    expect(lines[3]).toContain("2000,00");
    expect(lines[3]).toContain("2 ligne(s)");
  });

  it("nomme le fichier avec la période filtrée", () => {
    expect(
      salesJournalFilename({ dateFrom: "2026-07-01", dateTo: "2027-06-30" })
    ).toBe("journal-ventes_2026-07-01_2027-06-30.csv");
    expect(
      salesJournalFilename({ exportedAt: new Date("2026-10-13T12:00:00Z") })
    ).toBe("journal-ventes_2026-10-13.csv");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  buildInvoicePdfBytes,
  buildInvoicePdfPath,
  invoicePdfFilename,
  INVOICE_LOGO_PUBLIC_PATH,
  INVOICE_PAID_STAMP_PUBLIC_PATH,
} from "./invoice-pdf";

describe("invoice-pdf", () => {
  it("builds stable filename and storage path", () => {
    expect(invoicePdfFilename("26-27.14323")).toBe("Facture-26-27.14323.pdf");
    expect(buildInvoicePdfPath("stu", "ins", "26-27.14323")).toBe(
      "stu/ins/Facture-26-27.14323.pdf"
    );
  });

  it("produit une facture acquittée au format officiel (logo + tampon)", async () => {
    const logo = new Uint8Array(
      readFileSync(join(process.cwd(), "public", INVOICE_LOGO_PUBLIC_PATH))
    );
    const stamp = new Uint8Array(
      readFileSync(join(process.cwd(), "public", INVOICE_PAID_STAMP_PUBLIC_PATH))
    );
    const bytes = await buildInvoicePdfBytes({
      invoiceNumber: "26-27.14323",
      invoiceDate: "2026-10-09",
      dueDate: "2026-10-09",
      status: "paid",
      clientName: "Montaine Gros-Deleglise",
      clientAddress: "5 Chemin de la Roselière",
      clientPostalCode: "73100",
      clientCity: "Aix-les-Bains",
      courseDescription: "Formation Anglais",
      courseDateStart: "2026-09-16",
      courseDateEnd: "2026-10-07",
      courseDurationHours: 18,
      courseLocation: "En ligne",
      amountHt: 900,
      amountTtc: 900,
      acompteAmount: 150,
      acompteDate: "2026-08-31",
      paymentDate: "2026-09-02",
      paymentMethodLabel: "Carte bancaire en ligne + Virement",
      logoPngBytes: logo,
      paidStampPngBytes: stamp,
    });
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(15_000);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});

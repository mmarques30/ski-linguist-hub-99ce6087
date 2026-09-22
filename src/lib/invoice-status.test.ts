import { describe, expect, it } from "vitest";
import {
  INVOICE_OPEN_STATUSES,
  invoiceStatusLabel,
  isOpenInvoiceStatus,
} from "./invoice-status";

describe("invoice-status", () => {
  it("libellés FR", () => {
    expect(invoiceStatusLabel("en_attente")).toBe("En attente");
    expect(invoiceStatusLabel("a_relancer")).toBe("À relancer");
    expect(invoiceStatusLabel("paid")).toBe("Payée");
  });

  it("ouvre les statuts de recouvrement", () => {
    expect(isOpenInvoiceStatus("en_attente")).toBe(true);
    expect(isOpenInvoiceStatus("a_relancer")).toBe(true);
    expect(isOpenInvoiceStatus("sent")).toBe(true);
    expect(isOpenInvoiceStatus("paid")).toBe(false);
    expect(isOpenInvoiceStatus("cancelled")).toBe(false);
    expect(INVOICE_OPEN_STATUSES).toContain("en_attente");
    expect(INVOICE_OPEN_STATUSES).toContain("a_relancer");
  });
});

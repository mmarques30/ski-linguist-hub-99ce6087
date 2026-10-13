import { describe, expect, it } from "vitest";
import { invoicePaidDisplay } from "./invoice-paid-display";

describe("invoicePaidDisplay", () => {
  it("facture payée avec acompte : solde réglé, net 0 (pas « à payer »)", () => {
    const d = invoicePaidDisplay({
      status: "paid",
      acompteAmount: 150,
      totalTtc: 900,
    });
    expect(d.showAcompteBlock).toBe(true);
    expect(d.soldeLabel).toBe("Solde réglé");
    expect(d.soldeIsOutstanding).toBe(false);
    expect(d.netLabel).toBe("Net à payer");
    expect(d.netAmount).toBe(0);
  });

  it("facture non payée avec acompte : solde à payer restant", () => {
    const d = invoicePaidDisplay({
      status: "sent",
      acompteAmount: 150,
      totalTtc: 900,
    });
    expect(d.soldeLabel).toBe("Solde à payer");
    expect(d.soldeIsOutstanding).toBe(true);
    expect(d.netAmount).toBe(750);
  });

  it("facture payée sans acompte : payée intégralement", () => {
    const d = invoicePaidDisplay({ status: "paid", totalTtc: 900 });
    expect(d.showAcompteBlock).toBe(false);
    expect(d.netLabel).toBe("Payée intégralement");
    expect(d.netAmount).toBe(0);
  });
});

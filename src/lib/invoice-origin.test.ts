import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INVOICE_ORIGIN_APP,
  INVOICE_ORIGIN_IMPORT,
  isOperationalInvoiceOrigin,
} from "./invoice-origin";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("invoice origin — Pilotage hors import", () => {
  it("reconnaît l'origine opérationnelle", () => {
    expect(isOperationalInvoiceOrigin(INVOICE_ORIGIN_APP)).toBe(true);
    expect(isOperationalInvoiceOrigin(null)).toBe(true);
    expect(isOperationalInvoiceOrigin(INVOICE_ORIGIN_IMPORT)).toBe(false);
  });

  it("KPI paiements et actions filtrent origin=app", () => {
    const payments = source("src/hooks/usePayments.ts");
    const actions = source("src/hooks/useDashboardActionItems.ts");
    const finance = source("src/hooks/useFinancialDashboard.ts");
    expect(payments).toContain('eq("origin", INVOICE_ORIGIN_APP)');
    expect(actions).toContain('eq("origin", INVOICE_ORIGIN_APP)');
    expect(finance).toContain("eq('origin', INVOICE_ORIGIN_APP)");
  });

  it("migration annule les sent import échues sans les marquer paid", () => {
    const mig = source(
      "supabase/migrations/20260922090000_bl007_cancel_import_overdue.sql"
    );
    expect(mig).toContain("status = 'cancelled'");
    expect(mig).toContain("import_historique");
    expect(mig).not.toMatch(/status\s*=\s*'paid'/);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-007 — crons + producteurs notifications", () => {
  it("migration active les crons email et pose notify_admins", () => {
    const mig = source(
      "supabase/migrations/20260921140000_bl007_crons_notifs.sql"
    );
    expect(mig).toContain("notify_admins");
    expect(mig).toContain("process-invoice-reminders");
    expect(mig).toContain("process-schedule-reminders");
    expect(mig).toContain("process-survey-reminders");
    expect(mig).toContain("avancer-statuts-inscriptions");
    expect(mig).toContain("keep_active");
    expect(mig).toContain("submit_test_booking_candidate");
    expect(mig).toContain("Nouvelle demande de test oral");
    expect(mig).toContain("trg_notify_inscription_sans_formateur");
  });

  it("process-invoice-reminders notifie les admins sur facture échue", () => {
    const edge = source(
      "supabase/functions/process-invoice-reminders/index.ts"
    );
    expect(edge).toContain("notifications");
    expect(edge).toContain("Facture échue");
  });

  it("ensureInvoicePayment notifie un paiement reçu", () => {
    const hook = source("src/hooks/usePayments.ts");
    expect(hook).toContain("ensureInvoicePayment");
    expect(hook).toMatch(/ensureInvoicePayment[\s\S]*notifyAdmins/);
    expect(hook).toContain('type: "paiement"');
  });

  it("producteurs paiement et évaluation déjà branchés", () => {
    expect(source("src/hooks/usePayments.ts")).toContain('type: "paiement"');
    expect(source("src/hooks/useTestEvaluations.ts")).toContain(
      'type: "evaluation"'
    );
    expect(source("src/lib/notify-admins.ts")).toContain("notifyAdmins");
  });
});

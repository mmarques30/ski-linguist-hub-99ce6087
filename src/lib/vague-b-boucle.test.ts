import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildInscriptionOpsChecklist,
  checklistCompletion,
} from "@/lib/inscription-ops-checklist";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Vague B — checklist ops", () => {
  it("construit 6 jalons avec liens onglets", () => {
    const items = buildInscriptionOpsChecklist({
      inscriptionId: "abc",
      scheduleStatus: "pending",
      missingDocsCount: 2,
      paymentsReceivedTotal: 0,
      invoicesCount: 0,
      hasPortalAccount: false,
      portalInviteSent: false,
      hasSurvey: false,
    });
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.key)).toEqual([
      "horaire",
      "docs",
      "paiement",
      "facture",
      "portail",
      "enquete",
    ]);
    expect(items.every((i) => !i.done)).toBe(true);
    expect(items.find((i) => i.key === "docs")?.href).toBe(
      "/inscriptions/abc?tab=documents"
    );
    expect(items.find((i) => i.key === "paiement")?.href).toBe(
      "/inscriptions/abc?tab=financial"
    );
    expect(checklistCompletion(items)).toEqual({ done: 0, total: 6 });
  });

  it("coche horaire matin / après-midi et portail invité", () => {
    const items = buildInscriptionOpsChecklist({
      inscriptionId: "x",
      scheduleStatus: "matin",
      documentsSentAt: "2026-09-01",
      missingDocsCount: 0,
      paymentsReceivedTotal: 500,
      invoicesCount: 1,
      portalInviteSent: true,
      hasSurvey: true,
      surveyCompleted: true,
    });
    expect(checklistCompletion(items).done).toBe(6);
  });

  it("n'affiche pas docs done si missingDocsCount inconnu", () => {
    const items = buildInscriptionOpsChecklist({
      inscriptionId: "y",
    });
    expect(items.find((i) => i.key === "docs")?.done).toBe(false);
  });
});

describe("Vague B — wiring UI", () => {
  it("branche checklist + paiements sur la fiche", () => {
    const details = source("src/pages/inscriptions/InscriptionDetails.tsx");
    expect(details).toContain("InscriptionOpsChecklist");
    expect(details).toContain("InscriptionFinancialPayments");
    expect(details).toContain('searchParams.get("tab")');
    expect(details).toContain("value={activeTab}");
  });

  it("retire la liste paiements de l'onglet Accès", () => {
    const access = source("src/components/inscriptions/InscriptionClientAccessCard.tsx");
    expect(access).toContain("Voir paiements");
    expect(access).not.toContain("paymentStatusLabel");
    expect(access).toContain("tab=financial");
  });

  it("expose le rail À traiter et KPIs cliquables", () => {
    const dash = source("src/components/dashboard/DashboardGestao.tsx");
    expect(dash).toContain("DashboardActionRail");
    expect(dash).toContain('to="/inscriptions"');
    expect(dash).toContain("CA facturé du mois");
    expect(source("src/components/dashboard/DashboardActionRail.tsx")).toContain(
      "À traiter aujourd"
    );
  });

  it("masque le CTA mort sur /student/test", () => {
    const testPage = source("src/pages/student/StudentTest.tsx");
    expect(testPage).not.toContain('from "@/components/ui/button"');
    expect(testPage).toContain("inscription en ligne");
    expect(testPage).toContain("Aucun résultat pour l");
  });
});

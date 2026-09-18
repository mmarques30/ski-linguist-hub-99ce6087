import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildStudentSearchFilter } from "@/hooks/useStudents";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-032 — retrait onglet Facturation du dashboard", () => {
  it("DashboardGestao n'expose plus l'onglet billing ni Prévision de Facturation", () => {
    const dash = source("src/components/dashboard/DashboardGestao.tsx");
    expect(dash).not.toContain("Prévision de Facturation");
    expect(dash).not.toContain('value="billing"');
    expect(dash).not.toContain("tabBilling");
    expect(dash).not.toContain("billingForecast");
    expect(dash).not.toContain("useRevenueProjections");
    expect(dash).toContain("grid-cols-3");
  });

  it("useRevenueProjections est retiré de useDashboardStats", () => {
    const stats = source("src/hooks/useDashboardStats.ts");
    expect(stats).not.toContain("useRevenueProjections");
    expect(stats).not.toContain("revenue-projections");
  });
});

describe("BL-037 — pagination moniteurs et partenaires", () => {
  it("useSkiMonitors interroge Supabase avec count exact et range", () => {
    const hook = source("src/hooks/useSkiMonitors.ts");
    expect(hook).toContain('count: "exact"');
    expect(hook).toContain(".range(");
    expect(hook).toContain("rows:");
    expect(hook).toContain("total:");
  });

  it("useSkiMonitorStats utilise head:true pour les totaux", () => {
    const hook = source("src/hooks/useSkiMonitors.ts");
    expect(hook).toContain('count: "exact", head: true');
  });

  it("usePartners interroge Supabase avec count exact et range", () => {
    const hook = source("src/hooks/usePartners.ts");
    expect(hook).toContain('count: "exact"');
    expect(hook).toContain(".range(");
    expect(hook).toContain("rows:");
    expect(hook).toContain("total:");
  });

  it("usePartnerStats utilise head:true pour les totaux partenaires", () => {
    const hook = source("src/hooks/usePartners.ts");
    expect(hook).toMatch(/from\("partners"\)[\s\S]*count: "exact", head: true/);
  });

  it("MoniteursSki et PartnersList paginent côté UI", () => {
    const moniteurs = source("src/pages/moniteurs/MoniteursSki.tsx");
    expect(moniteurs).toContain("monitorPage");
    expect(moniteurs).toContain("au total");

    const partners = source("src/pages/partners/PartnersList.tsx");
    expect(partners).toContain("setPage(1)");
    expect(partners).toContain("au total");
  });
});

describe("BL-040 — recherche stagiaire prénom+nom", () => {
  it("buildStudentSearchFilter combine les jetons", () => {
    expect(buildStudentSearchFilter("ZZTEST")).toContain("first_name.ilike.%ZZTEST%");
    const multi = buildStudentSearchFilter("Jean Dupont");
    expect(multi).toContain("and(");
    expect(multi).toContain("Jean");
    expect(multi).toContain("Dupont");
    expect(buildStudentSearchFilter("  ")).toBeNull();
    expect(buildStudentSearchFilter("a%b")).not.toContain("%a%b%");
  });
});

describe("BL-049 — empty state recherche Students", () => {
  it("distingue aucun résultat de catalogue vide", () => {
    const page = source("src/pages/Students.tsx");
    expect(page).toContain("noSearchResults");
    expect(page).toContain("Aucun résultat pour cette recherche");
  });
});

describe("BL-045 — email placeholder affiché comme manquant", () => {
  it("InscriptionFormDialog utilise studentEmailLabel", () => {
    expect(source("src/components/inscriptions/InscriptionFormDialog.tsx")).toContain(
      "studentEmailLabel"
    );
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formateursAPayerDuMois,
  progressTowardTarget,
  resolveRevenueTarget,
  tresorerieEntrees,
  tresorerieSolde,
} from "@/lib/finance-pilotage";
import {
  LANGUAGE_CATALOG,
  LANGUAGE_LABELS,
  languageKeyFromLabel,
  languageLabelFromKey,
} from "@/lib/language-catalog";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";
import { INSTRUCTOR_LANGUAGES } from "@/lib/taught-languages";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Onda D1 — finance pilotage", () => {
  it("n'additionne pas les inscriptions aux factures (anti double comptage)", () => {
    expect(tresorerieEntrees({ facturesAEncaisser: 1000, formationsPlanifiees: 999 })).toBe(1000);
  });

  it("impute les formateurs au mois de periode_fin seulement", () => {
    const unpaid = [
      { montant: 100, periode_fin: "2026-03-15" },
      { montant: 50, periode_fin: "2026-02-28" },
      { montant: 20, periode_fin: null },
    ];
    expect(
      formateursAPayerDuMois({
        unpaid,
        startOfMonth: "2026-03-01",
        endOfMonth: "2026-03-31",
      })
    ).toBe(100);
    expect(
      formateursAPayerDuMois({
        unpaid,
        startOfMonth: "2026-04-01",
        endOfMonth: "2026-04-30",
      })
    ).toBe(0);
  });

  it("calcule solde et objectif saison", () => {
    expect(tresorerieSolde({ entrees: 500, chargesFixes: 100, formateursAPayer: 50 })).toBe(350);
    expect(resolveRevenueTarget({ revenue_target: 80000 })).toBe(80000);
    expect(resolveRevenueTarget({ revenue_target: null })).toBeNull();
    // Live: seasons.revenue_target = 0 (pas NULL) → traité comme non défini
    expect(resolveRevenueTarget({ revenue_target: 0 })).toBeNull();
    expect(resolveRevenueTarget({ revenue_target: -1 })).toBeNull();
    expect(progressTowardTarget(40000, 80000)).toBe(50);
    expect(progressTowardTarget(100, null)).toBeNull();
    expect(progressTowardTarget(100, 0)).toBeNull();
  });

  it("branche dépenses réelles et glossaire sur le dashboard", () => {
    const dash = source("src/pages/finance/FinanceDashboard.tsx");
    expect(dash).toContain("useExpensesByMonth");
    expect(dash).toContain("FinanceKpiGlossary");
    expect(dash).toContain("resolveRevenueTarget");
    expect(dash).not.toContain("target: 50000");
    expect(source("src/hooks/useFinancialDashboard.ts")).toContain("formateursAPayerDuMois");
  });
});

describe("Onda D2 — taxonomie langues", () => {
  it("aligne register et formateurs sur le catalogue", () => {
    expect(LANGUAGE_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(REGISTRATION_LANGUAGES.map((l) => l.value)).toEqual(
      LANGUAGE_CATALOG.map((l) => l.key)
    );
    expect([...INSTRUCTOR_LANGUAGES]).toEqual([...LANGUAGE_CATALOG.map((l) => l.instructor)]);
    expect(languageLabelFromKey("portuguese")).toBe("Portugais brésilien");
    expect(languageKeyFromLabel("Portugais brésilien")).toBe("portuguese");
    expect(LANGUAGE_LABELS).toContain("Anglais");
  });
});

describe("Onda D3 — SeasonContext", () => {
  it("expose le provider et filtre les listes", () => {
    expect(source("src/App.tsx")).toContain("SeasonProvider");
    const ctx = source("src/contexts/SeasonContext.tsx");
    expect(ctx).toContain("useSeasonFilter");
    expect(ctx).toContain("seasonStart");
    expect(ctx).toContain("seasonEnd");
    // Défaut « toutes » : en prod season_id est quasi partout NULL
    expect(ctx).toMatch(/return "all"/);
    expect(source("src/hooks/useInscriptions.ts")).toContain("seasonStart");
    expect(source("src/hooks/useInvoices.ts")).toContain("seasonStart");
    expect(source("src/hooks/useSessions.ts")).toContain("seasonStart");
    expect(source("src/hooks/useLeads.ts")).toContain("seasonStart");
    expect(source("src/pages/Inscriptions.tsx")).toContain("seasonStart");
    expect(source("src/pages/Invoices.tsx")).toContain("seasonEnd");
    expect(source("src/pages/Sessions.tsx")).toContain("seasonStart");
    expect(source("src/pages/commercial/CommercialDashboard.tsx")).toContain("seasonEnd");
    expect(source("src/components/layout/TopHeader.tsx")).toContain("SeasonFilterControl");
  });
});

describe("Onda D4 — journal email_log", () => {
  it("ajoute l'onglet Journal sur /admin/emails", () => {
    const emails = source("src/pages/admin/Emails.tsx");
    expect(emails).toContain("EmailSendJournal");
    expect(emails).toContain("Journal des envois");
    expect(source("src/components/admin/EmailSendJournal.tsx")).toContain('from("email_log")');
  });
});

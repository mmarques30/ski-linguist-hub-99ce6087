import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveRouteKey,
  routeKeyParent,
  PATH_TO_ROUTE_KEY,
} from "@/lib/route-permissions";
import { resolvePilotageTab } from "@/components/finance/PilotageSubnav";
import { NAV_SECTIONS } from "@/lib/navigation";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Vague C — permissions", () => {
  it("résout les clés de route (préfixe long)", () => {
    expect(resolveRouteKey("/finance")).toBe("finance");
    expect(resolveRouteKey("/finance/analyses")).toBe("finance");
    expect(resolveRouteKey("/finance/tresorerie")).toBe("finance.tresorerie");
    expect(resolveRouteKey("/admin/users")).toBe("admin");
    expect(resolveRouteKey("/inscriptions/abc")).toBe("inscriptions");
    expect(routeKeyParent("finance.payments")).toBe("finance");
    expect(routeKeyParent("portails.stagiaire")).toBe("students");
  });

  it("ProtectedRoute appelle canView", () => {
    const guard = source("src/components/auth/ProtectedRoute.tsx");
    expect(guard).toContain("canView");
    expect(guard).toContain("resolveRouteKey");
    expect(guard).toContain("AccessDenied");
    expect(source("src/components/auth/AccessDenied.tsx")).toContain("Accès non autorisé");
  });
});

describe("Vague C — sidebar & pilotage", () => {
  it("expose Trésorerie et Portails, garde Analyses/Rentabilité en sous-menus", () => {
    const items = NAV_SECTIONS.flatMap((s) => s.items);
    const premierNiveau = items.map((i) => i.href);
    expect(items.map((i) => i.id)).toContain("tresorerie");
    expect(premierNiveau).toContain("/portails/stagiaire");
    expect(premierNiveau).toContain("/portails/formateur");
    expect(premierNiveau).not.toContain("/finance/analyses");
    expect(premierNiveau).not.toContain("/finance/rentabilite");

    const tresorerie = items.find((i) => i.id === "tresorerie");
    expect(tresorerie?.children?.map((c) => c.href)).toEqual([
      "/finance/tresorerie",
      "/finance/tresorerie?tab=charges",
    ]);
  });

  it("PilotageSubnav active la bonne onglet", () => {
    expect(resolvePilotageTab("/finance")).toBe("overview");
    expect(resolvePilotageTab("/finance/analyses")).toBe("analyses");
    expect(resolvePilotageTab("/finance/rentabilite")).toBe("rentabilite");
  });

  it("pages finance partagent PilotageSubnav", () => {
    expect(source("src/pages/finance/FinanceDashboard.tsx")).toContain("PilotageSubnav");
    expect(source("src/pages/finance/FinanceAnalyses.tsx")).toContain("PilotageSubnav");
    expect(source("src/pages/finance/FinanceRentabilite.tsx")).toContain("PilotageSubnav");
    expect(source("src/pages/finance/FinanceTresorerie.tsx")).toContain("TresorerieSubnav");
  });

  it("mappe les chemins portails", () => {
    expect(PATH_TO_ROUTE_KEY["/portails/stagiaire"]).toBe("portails.stagiaire");
    expect(PATH_TO_ROUTE_KEY["/portails/formateur"]).toBe("portails.formateur");
  });
});

import { describe, expect, it } from "vitest";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";
import { PATH_TO_ROUTE_KEY, resolveRouteKey } from "@/lib/route-permissions";
import { isPathActive } from "@/lib/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("LP institutionnelle — routage public / app", () => {
  it("expose /app comme home staff", () => {
    expect(ADMIN_HOME_PATH).toBe("/app");
    expect(PATH_TO_ROUTE_KEY["/app"]).toBe("dashboard");
    expect(PATH_TO_ROUTE_KEY["/"]).toBeUndefined();
    expect(resolveRouteKey("/app")).toBe("dashboard");
    expect(resolveRouteKey("/")).toBeNull();
  });

  it("marque /app actif pour le tableau de bord", () => {
    expect(isPathActive("/app", "/app")).toBe(true);
    expect(isPathActive("/inscriptions", "/app")).toBe(false);
  });

  it("monte la landing publique et le mockup assets dans App", () => {
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain('path="/" element={<InstitutionalLanding />}');
    expect(app).toContain('path="/mockup/lp-assets"');
    expect(app).toContain('path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}');
  });
});

describe("LP institutionnelle — conformité spec", () => {
  const landing = () =>
    readFileSync(join(process.cwd(), "src/pages/landing/InstitutionalLanding.tsx"), "utf8");

  it("couvre les ancres et le CTA Acesso FLI du sitemap", () => {
    const src = landing();
    for (const id of ["inicio", "metodo", "parceiros", "formacoes", "faq"]) {
      expect(src).toContain(`id="${id}"`);
    }
    expect(src).toContain("Acesso FLI");
    expect(src).toContain('to="/auth"');
    expect(src).toContain("Réserver mon stage");
    expect(src).toContain("1cIivE5ggCk");
  });

  it("place la FAQ après le footer dans le flux", () => {
    const src = landing();
    const footerIdx = src.indexOf("<footer");
    const faqIdx = src.indexOf('id="faq"');
    expect(footerIdx).toBeGreaterThan(0);
    expect(faqIdx).toBeGreaterThan(footerIdx);
  });
});

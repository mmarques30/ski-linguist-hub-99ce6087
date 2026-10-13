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

  it("couvre les ancres françaises et le CTA Accès FLI du sitemap", () => {
    const src = landing();
    for (const id of ["accueil", "methode", "partenaires", "formations", "faq"]) {
      expect(src).toContain(`id="${id}"`);
    }
    expect(src).toContain("Accès FLI");
    for (const label of ["Notre méthode", "Partenaires", "Formations"]) {
      expect(src).toContain(`label: "${label}"`);
    }
    expect(src).toContain('to="/auth"');
    expect(src).toContain("Réserver mon stage");
    expect(src).toContain("YOUTUBE_VIDEO_ID");
  });

  it("force la couleur des titres sur fonds colorés (règle globale h1–h6 text-foreground)", () => {
    const src = landing();
    const headings = src.match(/<h[1-6][^>]*className="[^"]*"/g) ?? [];
    expect(headings.length).toBeGreaterThan(0);
    for (const h of headings) {
      expect(h, h).toMatch(/text-(white|\[hsl\(var\(--fli-navy\)\)\])/);
    }
  });

  it("ne laisse aucun libellé ou ancre en portugais", () => {
    const sources = [
      landing(),
      readFileSync(join(process.cwd(), "src/pages/landing/AssetValidationMockup.tsx"), "utf8"),
    ];
    for (const src of sources) {
      expect(src).not.toMatch(/Acesso FLI|Nosso Método|Parceiros|Formações|#inicio|#metodo|#parceiros|#formacoes/);
    }
  });

  it("place la FAQ après le footer dans le flux", () => {
    const src = landing();
    const footerIdx = src.indexOf("<footer");
    const faqIdx = src.indexOf('id="faq"');
    expect(footerIdx).toBeGreaterThan(0);
    expect(faqIdx).toBeGreaterThan(footerIdx);
  });
});

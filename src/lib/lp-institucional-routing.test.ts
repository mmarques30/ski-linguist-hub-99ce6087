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

  it("importe le routeur de l'app, pas react-router-dom", () => {
    const mockup = readFileSync(
      join(process.cwd(), "src/pages/landing/AssetValidationMockup.tsx"),
      "utf8",
    );
    expect(mockup).toContain('from "react-router"');
    expect(mockup).not.toContain("react-router-dom");
  });
});

describe("LP institutionnelle — conformité spec", () => {
  const landing = () =>
    readFileSync(join(process.cwd(), "src/pages/landing/InstitutionalLanding.tsx"), "utf8");

  it("couvre les ancres et le CTA Accès FLI, entièrement en français", () => {
    const src = landing();
    for (const id of ["inicio", "metodo", "parceiros", "formacoes", "stages", "faq"]) {
      expect(src).toContain(`id="${id}"`);
    }
    expect(src).toContain("Accès FLI");
    expect(src).toContain("Notre méthode");
    expect(src).toContain("Partenaires");
    expect(src).toContain("Formations");
    for (const portuguese of ["Acesso FLI", "Nosso Método", "Parceiros", "Formações"]) {
      expect(src).not.toContain(portuguese);
    }
    expect(src).toContain('from "react-router"');
    expect(src).not.toContain("react-router-dom");
    expect(src).toContain('to="/auth"');
    expect(src).toContain("Réserver mon stage");
    expect(src).toContain("YOUTUBE_VIDEO_ID");
  });

  it("affiche les groupes de 8 personnes", () => {
    const src = landing();
    expect(src).toContain("Groupes de 8 personnes");
    expect(src).not.toContain("Groupes de 8 max");
    expect(src).not.toContain("Groupes de 8 maximum");
    expect(src).not.toContain("Groupes de 6");
  });

  it("liste les stages par langue, avec lieu et dates, à partir du catalogue public", () => {
    const src = landing();
    expect(src).toContain("useRegistrationOfferings");
    expect(src).toContain("groupSessionsByLanguage");
    expect(src).toContain("location_label");
    expect(src).toContain("date_label");
    expect(src).toContain('to="/register"');
  });

  it("place la FAQ après le footer dans le flux", () => {
    const src = landing();
    const footerIdx = src.indexOf("<footer");
    const faqIdx = src.indexOf('id="faq"');
    expect(footerIdx).toBeGreaterThan(0);
    expect(faqIdx).toBeGreaterThan(footerIdx);
  });
});

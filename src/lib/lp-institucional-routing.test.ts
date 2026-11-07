import { describe, expect, it } from "vitest";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";
import { PATH_TO_ROUTE_KEY, resolveRouteKey } from "@/lib/route-permissions";
import { isPathActive } from "@/lib/navigation";
import { buildContactMailto, FLI_CONTACT_EMAIL } from "@/lib/landing-contact";
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
    for (const id of ["inicio", "metodo", "formacoes", "stages", "faq"]) {
      expect(src).toContain(`id="${id}"`);
    }
    expect(src).not.toContain('id="parceiros"');
    expect(src).not.toContain("Ils nous font confiance");
    expect(src).toContain("Accès FLI");
    expect(src).toContain("Notre méthode");
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

  it("indique que FLI a plus de 40 ans", () => {
    const src = landing();
    expect(src).toContain("+ de 40 ans");
    expect(src).not.toContain("Depuis 2018");
  });

  it("ne publie pas le tarif dans la FAQ", () => {
    const src = landing();
    expect(src).not.toContain("Le coût est-il élevé");
    expect(src).not.toContain("750 €");
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

  it("affiche la marque Qualiopi dans le footer", () => {
    const src = landing();
    const footer = src.slice(src.indexOf("<footer"));
    expect(footer).toContain("qualiopiCertification");
    expect(footer).toContain("Actions de formation");
    expect(src).toContain("qualiopi-certification.png");
  });

  it("utilise Outfit pour les titres, plus Syne (lisibilité, Paula 21/10)", () => {
    const src = landing();
    const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
    expect(src).not.toContain("Syne");
    expect(html).not.toContain("Syne");
    expect(src).toMatch(/\.lp-display \{ font-family: "Outfit"/);
    expect(src).not.toContain("font-extrabold");
  });

  it("formation certifiante : Linguaskill et Bright, sans « éligible Qualiopi »", () => {
    const src = landing();
    expect(src).toContain('"Centre agréé Linguaskill et Bright."');
    expect(src).not.toContain("éligible Qualiopi");
  });

  it("devis et contact ouvrent le dialog (pas de mailto nu sur les CTA)", () => {
    const src = landing();
    expect(src).toContain("ContactDialog");
    expect(src).toContain('setContactIntent("devis")');
    expect(src).toContain('setContactIntent("question")');
    const main = src.slice(src.indexOf("<main"), src.indexOf("<footer"));
    expect(main).not.toContain('href="mailto:');
  });

  it("construit un mailto pré-rempli par intention", () => {
    const devis = buildContactMailto("devis");
    expect(devis.startsWith(`mailto:${FLI_CONTACT_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(devis)).toContain("Demande de devis");
    expect(decodeURIComponent(devis)).toContain("Nombre de personnes");
    expect(decodeURIComponent(buildContactMailto("question"))).toContain("Question — formations FLI");
  });

  it("stages : un bloc par langue avec tuiles en grille et format de session", () => {
    const src = landing();
    expect(src).toContain("formatSessionFormat");
    expect(src).toContain("sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4");
    expect(src).toMatch(/\{group\.sessions\.length\}/);
  });

  it("FAQ repensée par thèmes, sourcée CGV / sessions / FIF PL", () => {
    const src = landing();
    expect(src).toContain("FAQ_GROUPS");
    for (const title of ["Avant de m'inscrire", "Inscription et financement", "Pendant et après"]) {
      expect(src).toContain(`title: "${title}"`);
    }
    for (const q of [
      "À qui s'adressent les formations FLI ?",
      "Quelles langues proposez-vous ?",
      "Puis-je faire financer ma formation ?",
      "Et si je dois annuler ?",
      "FLI est-elle certifiée Qualiopi ?",
    ]) {
      expect(src).toContain(q);
    }
    expect(src).toContain("10 jours");
    expect(src).toContain("900 € par an");
    expect(src).toContain("frais de dossier de 150 €");
    expect(src).not.toContain("Brevet d'État");
    expect(src).not.toContain("réseau RHF");
  });

  it("place le footer après la FAQ, en bas de page", () => {
    const src = landing();
    const footerIdx = src.indexOf("<footer");
    const faqIdx = src.indexOf('id="faq"');
    expect(faqIdx).toBeGreaterThan(0);
    expect(footerIdx).toBeGreaterThan(faqIdx);
    expect(src).toContain("mt-auto");
  });
});

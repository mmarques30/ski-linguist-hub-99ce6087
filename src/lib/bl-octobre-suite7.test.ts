import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-octobre suite 7 — page Documents honnête", () => {
  it("pointe vers les inscriptions et les modèles, sans faux upload", () => {
    const docs = source("src/pages/Documents.tsx");
    expect(docs).toContain('to="/inscriptions"');
    expect(docs).toContain('to="/admin/registration-documents"');
    expect(docs).toContain("pack d'accueil");
    expect(docs).toContain("pack de fin de formation");
    expect(docs).not.toContain("<Upload");
    expect(docs).not.toContain("Téléverser un document");
    expect(docs).not.toContain("Module en construction");
    expect(docs).not.toContain("disabled");
    expect(docs).not.toContain("FolderOpen");
    expect(docs).not.toContain("searchPlaceholder");
  });
});

describe("BL-octobre suite 7 — pagination fantôme retirée", () => {
  it("Inscriptions n'affiche plus de boutons Précédent/Suivant désactivés", () => {
    const page = source("src/pages/Inscriptions.tsx");
    expect(page).not.toContain("translations.previous");
    expect(page).not.toContain("translations.next");
    expect(page).not.toMatch(/<Button[^>]*disabled[^>]*>[\s\S]*Précédent/);
    expect(page).not.toMatch(/from "lucide-react"[^;]*\bFilter\b/);
    expect(page).not.toMatch(/from "lucide-react"[^;]*\bDownload\b/);
  });

  it("Students n'affiche plus de boutons Précédent/Suivant désactivés", () => {
    const page = source("src/pages/Students.tsx");
    expect(page).not.toContain("translations.previous");
    expect(page).not.toContain("translations.next");
    expect(page).not.toMatch(/<Button[^>]*disabled[^>]*>[\s\S]*Précédent/);
    expect(page).not.toMatch(/from "lucide-react"[^;]*\bFilter\b/);
    expect(page).not.toMatch(/from "lucide-react"[^;]*\bDownload\b/);
  });
});

describe("BL-octobre suite 7 — doc Stripe à jour", () => {
  it("STRIPE_SETUP pointe vers Settings StatusRow et check-stripe-config", () => {
    const doc = source("docs/STRIPE_SETUP.md");
    expect(doc).toContain("check-stripe-config");
    expect(doc).toContain("StatusRow");
    expect(doc).toContain("StripeSettingsCard");
    expect(doc).not.toMatch(/\*\*Manquant\*\* — bloque l'enregistrement automatique/);
  });
});

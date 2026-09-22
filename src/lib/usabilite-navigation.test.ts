import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NAV_SECTIONS } from "@/lib/navigation";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("usabilité — navigation et intégration", () => {
  it("expose les sections produit et garde Documents hors menu", () => {
    const sidebar = source("src/components/layout/Sidebar.tsx");
    const arbre = source("src/lib/navigation.ts");
    expect(NAV_SECTIONS.map((s) => s.id)).toContain("operations");
    expect(NAV_SECTIONS.map((s) => s.id)).toContain("commercial");
    expect(NAV_SECTIONS.map((s) => s.id)).toContain("finance");
    expect(sidebar).toContain('collapsible="icon"');
    expect(arbre).toContain("/inscriptions/schedule-validation");
    expect(arbre).toContain("/admin/registration-documents");
    expect(arbre).not.toContain("Horaires J-10");
    expect(arbre).not.toMatch(/href: "\/documents"/);
  });

  it("bloque les breadcrumbs non navigables", () => {
    const crumbs = source("src/components/layout/Breadcrumbs.tsx");
    expect(crumbs).toContain('"/gestion"');
    expect(crumbs).toContain('"/admin"');
    expect(crumbs).toContain("NON_NAVIGABLE_PATHS");
  });

  it("rend le code d'inscription copiable", () => {
    const card = source("src/components/inscriptions/InscriptionClientAccessCard.tsx");
    expect(card).toContain("handleCopyCode");
    expect(card).toContain("Code d'inscription copié");
    expect(card).toContain("Mode Assister");
  });

  it("corrige les SelectItem vides", () => {
    expect(source("src/components/commercial/LeadFormDialog.tsx")).toContain(
      'value="none"'
    );
    expect(source("src/components/invoices/InvoiceCreateDialog.tsx")).toContain(
      'value="none"'
    );
    expect(source("src/components/commercial/LeadFormDialog.tsx")).not.toContain(
      '<SelectItem value="">'
    );
    expect(source("src/components/invoices/InvoiceCreateDialog.tsx")).not.toContain(
      '<SelectItem value="">'
    );
  });

  it("relie les fiches aux entités voisines", () => {
    const details = source("src/pages/inscriptions/InscriptionDetails.tsx");
    expect(details).toContain("`/formateurs/${inscription.instructor_id}`");
    expect(details).toContain("/gestion/partenaires/");
    expect(details).toContain("/invoices?q=");
    expect(source("src/pages/students/StudentDetails.tsx")).toContain(
      "`/inscriptions/${inscription.id}`"
    );
    expect(source("src/pages/finance/FinancePayments.tsx")).toContain(
      "/inscriptions/${p.inscription_id}"
    );
  });
});

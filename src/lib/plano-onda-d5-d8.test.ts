import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildOrganizationEmailFooterHtml,
  organizationInvoiceHeader,
  parseOrganizationIdentity,
} from "@/lib/organization-identity";
import { IMPORT_UPSERT_KEYS, prepareImport } from "@/lib/admin-import-engine";
import { CHROME_NAV, CHROME_SECTIONS, CHROME_UI } from "@/lib/chrome-i18n";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Onda D5 — identité org factures / emails / logo", () => {
  it("persiste logo_url et construit en-tête / pied", () => {
    const id = parseOrganizationIdentity({
      legal_name: "FLI Test",
      address_line: "1 rue A",
      postal_code: "73000",
      city: "Chambéry",
      phone: "0102030405",
      email: "info@test.fr",
      logo_url: "https://example.com/logo.png",
    });
    expect(id.logo_url).toBe("https://example.com/logo.png");
    expect(buildOrganizationEmailFooterHtml(id)).toContain("FLI Test");
    expect(organizationInvoiceHeader(id).logoUrl).toContain("logo.png");
  });

  it("branche InvoiceTemplate et Settings sur l'identité", () => {
    expect(source("src/components/invoices/InvoiceTemplate.tsx")).toContain(
      "useOrganizationIdentity"
    );
    expect(source("src/components/settings/OrganizationIdentityCard.tsx")).toContain(
      "organization-assets"
    );
    expect(source("supabase/functions/_shared/fli-email.ts")).toContain(
      "buildFliFooterHtml"
    );
    expect(
      source("supabase/migrations/20260918170000_organization_assets_bucket.sql")
    ).toContain("organization-assets");
  });
});

describe("Onda D6 — chrome i18n", () => {
  it("expose les libellés FR du chrome et les branche", () => {
    expect(CHROME_SECTIONS.operations.fr).toBe("Opérations");
    expect(CHROME_NAV["/inscriptions"].fr).toBe("Inscriptions");
    expect(CHROME_UI.logout.fr).toBe("Déconnexion");
    expect(source("src/components/layout/Sidebar.tsx")).toContain("chrome-i18n");
    expect(source("src/components/layout/Breadcrumbs.tsx")).toContain("CHROME_BREADCRUMB");
    expect(source("src/components/layout/TopHeader.tsx")).toContain("CHROME_UI");
  });
});

describe("Onda D7 — import upsert / export purge / nouveaux types", () => {
  it("définit les clés naturelles et prépare les leads", () => {
    expect(IMPORT_UPSERT_KEYS.students).toBe("email");
    expect(IMPORT_UPSERT_KEYS.leads).toBe("contact_email");
    const prepared = prepareImport(
      [{ contact_name: "Ada Lovelace", contact_email: "ada@example.com" }],
      "leads"
    );
    expect(prepared.acceptedCount).toBe(1);
    expect(source("src/pages/admin/Import.tsx")).toContain("upsert");
    expect(source("src/pages/admin/Import.tsx")).toContain("purge-backup");
  });
});

describe("Onda D8 — CRM leads", () => {
  it("ajoute dates projet, perte, delete et moniteur", () => {
    expect(source("src/hooks/useLeads.ts")).toContain("project_start");
    expect(source("src/hooks/useLeads.ts")).toContain("Effectif estimé");
    expect(source("src/components/commercial/LeadFormDialog.tsx")).toContain(
      "loss_reason"
    );
    expect(source("src/components/commercial/LeadFormDialog.tsx")).toContain(
      "useDeleteLead"
    );
    expect(source("src/pages/commercial/CommercialDashboard.tsx")).toContain(
      "Marquer perdu"
    );
    expect(
      source("supabase/migrations/20260918171000_onda_d8_leads_crm.sql")
    ).toContain("ski_monitor_id");
  });
});

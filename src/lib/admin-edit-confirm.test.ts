import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde : les écrans admin d'édition demandent une confirmation
 * (useConfirmAction) avant toute mutation.
 */

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("admin edit — confirmation avant mutation", () => {
  it("wire useConfirmAction dans les menus / formulaires critiques", () => {
    const files = [
      "src/components/inscriptions/InscriptionStatusMenu.tsx",
      "src/components/inscriptions/InscriptionFormDialog.tsx",
      "src/components/students/StudentFormDialog.tsx",
      "src/pages/Invoices.tsx",
      "src/components/inscriptions/InscriptionFundingCard.tsx",
      "src/components/partners/PartnerFormDialog.tsx",
      "src/components/formateurs/InstructorFormDialog.tsx",
      "src/pages/formateurs/InstructorDetails.tsx",
      "src/pages/commercial/CommercialDashboard.tsx",
      "src/pages/admin/UserManagement.tsx",
      "src/pages/admin/Phrases.tsx",
      "src/components/inscriptions/PlacementTestSummaryCard.tsx",
      "src/components/inscriptions/ScheduleApprovalDialog.tsx",
    ];
    for (const file of files) {
      expect(source(file), `${file} doit importer useConfirmAction`).toContain(
        "useConfirmAction"
      );
    }
  });

  it("StudentDetails ouvre StudentFormDialog pour l'édition", () => {
    const details = source("src/pages/students/StudentDetails.tsx");
    expect(details).toContain("StudentFormDialog");
    expect(details).toContain('canEdit("students")');
  });

  it("InscriptionFormDialog couvre les champs opérationnels", () => {
    const form = source("src/components/inscriptions/InscriptionFormDialog.tsx");
    expect(form).toContain("expectations");
    expect(form).toContain("dates_to_confirm");
    expect(form).toContain("exit_level");
    expect(form).toContain("group_name");
    expect(form).toContain("pedagogical_cost");
  });
});

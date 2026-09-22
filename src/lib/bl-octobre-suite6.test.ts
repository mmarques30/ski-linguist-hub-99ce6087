import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("DashboardGestao — retrait checklist Préparation fictive", () => {
  it("n'expose plus l'onglet Préparation ni la progression simulée", () => {
    const dash = source("src/components/dashboard/DashboardGestao.tsx");
    expect(dash).not.toContain('value="preparation"');
    expect(dash).not.toContain("tabPreparation");
    expect(dash).not.toContain("classPreparation");
    expect(dash).not.toContain("Simulated validation progress");
    expect(dash).not.toContain("enoughStudents");
    expect(dash).not.toContain("materialsReady");
    // Même garde que BL-032 : deux onglets, ni Préparation ni Facturation.
    expect(dash).toContain('"inscriptions" | "tests"');
  });
});

describe("BL-014 — candidat → actif", () => {
  it("InstructorDetails propose un CTA Passer en actif·ve pour les candidat·es", () => {
    const details = source("src/pages/formateurs/InstructorDetails.tsx");
    expect(details).toContain('instructor.status === "candidat"');
    expect(details).toContain("Passer en actif·ve");
    expect(details).toContain("activationConfirmDescription");
    expect(details).toContain("candidatActivationGaps");
    expect(details).toContain("STATUT_ADMINISTRATIF_PRESETS");
    expect(details).toContain("Passer en inactif·ve");
    expect(details).toMatch(/status:\s*"actif"/);
    expect(details).toMatch(/is_active:\s*true/);
    expect(details).toContain("updateInstructor.mutate");
    expect(details).not.toContain('value: "candidat"');
  });

  it("InstructorsList active depuis la liste candidat·es", () => {
    const list = source("src/pages/formateurs/InstructorsList.tsx");
    expect(list).toContain("onActivate");
    expect(list).toContain("activateCandidat");
    expect(list).toContain("activationConfirmDescription");
    expect(list).toContain("Aucun·e candidat·e");
  });

  it("InstructorCard affiche le CTA d'activation pour les candidat·es", () => {
    const card = source("src/components/formateurs/InstructorCard.tsx");
    expect(card).toContain("onActivate");
    expect(card).toContain("Passer en actif·ve");
    expect(card).toContain("candidatActivationGaps");
  });

  it("InstructorFormDialog crée les nouveaux formateurs en statut candidat", () => {
    const dialog = source("src/components/formateurs/InstructorFormDialog.tsx");
    expect(dialog).toMatch(/emptyForm[\s\S]*status:\s*"candidat"/);
    expect(dialog).toContain('is_active: form.status === "actif"');
    expect(dialog).toContain("STATUT_ADMINISTRATIF_PRESETS");
    expect(dialog).toContain("statut candidat·e");
  });
});

describe("A6 — QualiopiAudit reset formulaire", () => {
  it("réinitialise le formulaire via useEffect sur indicator.id", () => {
    const page = source("src/pages/qualite/QualiopiAudit.tsx");
    expect(page).toContain("useEffect");
    expect(page).toMatch(/indicator\?\.id/);
    expect(page).not.toMatch(/useState\(\s*\(\)\s*=>\s*\{[\s\S]*setForm/);
  });
});

describe("A6 — StudentDetails codes statut", () => {
  it("filtre et badges utilisent les codes DB terminee/facturee", () => {
    const page = source("src/pages/students/StudentDetails.tsx");
    expect(page).toContain('"terminee"');
    expect(page).toContain('"facturee"');
    expect(page).toContain("getStatusLabel");
    // La couleur du badge vient désormais de toneForStatus (kit), plus d'un
    // tableau de classes local ; le libellé reste getStatusLabel.
    expect(page).toContain("toneForStatus");
    expect(page).not.toContain('status === "Terminé"');
    expect(page).not.toContain('status === "Facturé"');
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Vague D — états vides honnêtes", () => {
  it("n'affiche plus le faux succès sur les évaluations en attente", () => {
    const list = source("src/pages/formateur/EvaluationsList.tsx");
    expect(list).not.toContain("Toutes les évaluations sont à jour !");
    expect(list).toContain("Aucune évaluation en attente");
  });

  it("Documents annonce la maquette et désactive l'upload", () => {
    const docs = source("src/pages/Documents.tsx");
    expect(docs).toContain("Module en construction");
    expect(docs).toContain("disabled");
    expect(docs).toContain("Bibliothèque documents non branchée");
  });

  it("Sessions explique un planning vide", () => {
    const sessions = source("src/pages/Sessions.tsx");
    expect(sessions).toContain("Aucune session sur cette période");
  });
});

describe("Vague D — recherche globale", () => {
  it("debounce + partenaires, leads, paiements, sessions", () => {
    const search = source("src/components/layout/GlobalSearch.tsx");
    expect(search).toContain("DEBOUNCE_MS");
    expect(search).toContain('from("partners")');
    expect(search).toContain('from("leads")');
    expect(search).toContain('from("payments")');
    expect(search).toContain('from("sessions")');
    expect(search).toContain("/invoices?q=");
    expect(search).toContain(".in(\"student_id\"");
  });
});

describe("Vague D — notifications multi-types", () => {
  it("expose /notifications et producteurs paiement/évaluation", () => {
    expect(source("src/App.tsx")).toContain('path="/notifications"');
    expect(source("src/pages/Notifications.tsx")).toContain("useAllNotifications");
    expect(source("src/components/layout/TopHeader.tsx")).toContain(
      "Voir toutes les notifications"
    );
    expect(source("src/lib/notify-admins.ts")).toContain("notifyAdmins");
    expect(source("src/hooks/usePayments.ts")).toContain('type: "paiement"');
    expect(source("src/hooks/useTestEvaluations.ts")).toContain('type: "evaluation"');
  });
});

describe("Vague D — pont évaluation ↔ inscription", () => {
  it("branche EvaluationStudentBridge sur la liste", () => {
    const list = source("src/pages/formateur/EvaluationsList.tsx");
    expect(list).toContain("EvaluationStudentBridge");
    const bridge = source("src/components/evaluations/EvaluationStudentBridge.tsx");
    expect(bridge).toContain("Lier à un stagiaire");
    expect(bridge).toContain("test_candidates");
    expect(bridge).toContain("/inscriptions/");
  });
});

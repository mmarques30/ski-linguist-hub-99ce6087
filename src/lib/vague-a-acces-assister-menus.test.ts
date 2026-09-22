import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NAV_SECTIONS } from "@/lib/navigation";
import {
  buildInscriptionSuiviUrl,
  studentAssistPath,
} from "@/lib/client-links";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Vague A — suivi, Assister, menus", () => {
  it("construit le lien de suivi public", () => {
    expect(buildInscriptionSuiviUrl("https://app.example", "abc-uuid")).toBe(
      "https://app.example/suivi/abc-uuid"
    );
  });

  it("construit le chemin Assister stagiaire", () => {
    expect(studentAssistPath("stu-1", "documents")).toBe(
      "/portails/stagiaire/stu-1/documents"
    );
  });

  it("expose la route publique /suivi/:token et les routes Assister", () => {
    const app = source("src/App.tsx");
    expect(app).toContain('path="/suivi/:token"');
    expect(app).toContain('path="/portails/stagiaire/:studentId"');
    expect(app).toContain("StudentAssistViewProvider");
    expect(app).toContain("AssistStudentRoute");
  });

  it("affiche le lien de suivi dans Accès client", () => {
    const card = source("src/components/inscriptions/InscriptionClientAccessCard.tsx");
    expect(card).toContain("Lien de suivi");
    expect(card).toContain("buildInscriptionSuiviUrl");
    expect(card).toContain("Voir comme le stagiaire");
    expect(card).toContain("studentAssistPath");
  });

  it("réutilise StudentLayout avec bandeau Assister", () => {
    const layout = source("src/components/layout/StudentLayout.tsx");
    expect(layout).toContain("Mode Assister");
    expect(layout).toContain("useStudentView");
    expect(layout).toContain("isAssistMode");
  });

  it("réduit Finance à 3 items et sépare Évaluations orales", () => {
    const finance = NAV_SECTIONS.find((s) => s.id === "finance");
    expect(finance?.items.map((i) => i.id)).toEqual([
      "facturation",
      "pilotage",
      "tresorerie",
    ]);
    // Analyses / Rentabilité restent des sous-menus de Pilotage, pas des entrées.
    expect(
      finance?.items.find((i) => i.id === "pilotage")?.children?.map((c) => c.href),
    ).toEqual(["/finance", "/finance/analyses", "/finance/rentabilite"]);

    const operations = NAV_SECTIONS.find((s) => s.id === "operations");
    const evaluations = operations?.items.find((i) => i.id === "evaluations");
    expect(evaluations?.children?.map((c) => c.href)).toContain("/formateur/evaluations");

    const moniteurs = NAV_SECTIONS.find((s) => s.id === "commercial")?.items.find(
      (i) => i.id === "moniteurs",
    );
    expect(moniteurs?.badgeKey).toBe("frozen");
  });

  it("inclut access_token dans la migration et le RPC", () => {
    const migration = source(
      "supabase/migrations/20260918070000_inscription_access_token_suivi.sql"
    );
    expect(migration).toContain("access_token");
    expect(migration).toContain("get_inscription_suivi_by_token");
    expect(migration).toContain("regenerate_inscription_access_token");
  });
});

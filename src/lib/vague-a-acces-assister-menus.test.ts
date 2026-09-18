import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    const sidebar = source("src/components/layout/Sidebar.tsx");
    expect(sidebar).toContain('name: "Pilotage"');
    expect(sidebar).toContain('name: "Évaluations orales"');
    expect(sidebar).toContain('badge: "gelé"');
    expect(sidebar).not.toContain('name: "Analyses"');
    expect(sidebar).not.toContain('name: "Rentabilité"');
    expect(sidebar).not.toContain('name: "Vue d\'ensemble"');
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

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("RPC questionnaire satisfaction — jeton uuid", () => {
  const migration = source(
    "supabase/migrations/20261013200000_fix_satisfaction_survey_token_rpc.sql"
  );
  const hardening = source(
    "supabase/migrations/20260731150000_security_rls_hardening.sql"
  );
  const hook = source("src/hooks/useSatisfactionSurvey.ts");

  it("retire les surcharges text qui causaient uuid = text", () => {
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.get_satisfaction_survey_context(text)"
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.submit_satisfaction_survey_by_token(text, jsonb)"
    );
  });

  it("expose les RPC avec p_token uuid (comme suivi / contrat)", () => {
    expect(migration).toMatch(
      /CREATE OR REPLACE FUNCTION public\.get_satisfaction_survey_context\(p_token uuid\)/
    );
    expect(migration).toMatch(
      /CREATE OR REPLACE FUNCTION public\.submit_satisfaction_survey_by_token\(\s*p_token uuid,\s*p_data jsonb\s*\)/s
    );
    expect(migration).toContain("WHERE s.token = p_token");
    expect(migration).toContain("WHERE token = p_token");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_satisfaction_survey_context(uuid) TO anon, authenticated"
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.submit_satisfaction_survey_by_token(uuid, jsonb) TO anon, authenticated"
    );
  });

  it("joint inscriptions + instructors (pas la vue security_invoker)", () => {
    expect(migration).toContain("LEFT JOIN public.inscriptions i ON i.id = s.inscription_id");
    expect(migration).toContain(
      "LEFT JOIN public.instructors ins ON ins.id = i.instructor_id"
    );
    expect(migration).not.toMatch(
      /LEFT JOIN public\.inscriptions_complete/
    );
  });

  it("le hook front appelle toujours les deux RPC par jeton", () => {
    expect(hook).toContain('rpc("get_satisfaction_survey_context"');
    expect(hook).toContain('rpc("submit_satisfaction_survey_by_token"');
    expect(hook).toContain("p_token: token");
  });

  it("documente le bug introduit par le durcissement RLS (régression)", () => {
    // La migration historique reste en place ; le correctif la remplace.
    expect(hardening).toContain(
      "CREATE OR REPLACE FUNCTION public.get_satisfaction_survey_context(p_token text)"
    );
    expect(hardening).toContain("WHERE s.token = p_token");
  });
});

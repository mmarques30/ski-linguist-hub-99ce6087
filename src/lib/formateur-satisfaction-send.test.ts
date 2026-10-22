import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Envoi manuel questionnaire satisfaction (formateur)", () => {
  it("edge send-satisfaction-survey : auth staff/formateur + périmètre", () => {
    const edge = source(
      "supabase/functions/send-satisfaction-survey/index.ts"
    );
    expect(edge).toContain("requireStaffOrFormateur");
    expect(edge).toContain('TEMPLATE_SLUG = "satisfaction_survey_day0"');
    expect(edge).toContain("Inscription hors de ton périmètre");
    expect(edge).toContain("instructor_id");
    expect(edge).toContain("auth_user_id");
  });

  it("admin-auth expose requireStaffOrFormateur", () => {
    const auth = source("supabase/functions/_shared/admin-auth.ts");
    expect(auth).toContain("export async function requireStaffOrFormateur");
    expect(auth).toContain('"formateur"');
  });

  it("migration day0_sent_at + policy formateur", () => {
    const mig = source(
      "supabase/migrations/20261022180000_formateur_send_satisfaction_survey.sql"
    );
    expect(mig).toContain("day0_sent_at");
    expect(mig).toContain("rls_satisfaction_surveys_select_formateur");
  });

  it("UI + hook branchés", () => {
    expect(
      source("src/components/formateur/FormateurSatisfactionSendPanel.tsx")
    ).toContain("useSendSatisfactionSurvey");
    expect(source("src/hooks/useSendSatisfactionSurvey.ts")).toContain(
      "send-satisfaction-survey"
    );
    expect(source("src/pages/formateur/FormateurStagiaires.tsx")).toContain(
      "FormateurSatisfactionSendPanel"
    );
    expect(source("src/pages/formateur/FormateurMissionDetail.tsx")).toContain(
      "FormateurSatisfactionSendPanel"
    );
    expect(
      source("src/pages/formateur/FormateurStagiaireDetail.tsx")
    ).toContain("FormateurSatisfactionSendPanel");
  });

  it("config.toml verify_jwt", () => {
    const cfg = source("supabase/config.toml");
    expect(cfg).toContain("[functions.send-satisfaction-survey]");
    expect(cfg).toContain("verify_jwt = true");
  });
});

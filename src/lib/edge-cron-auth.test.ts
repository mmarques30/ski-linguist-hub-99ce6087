import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("Edge cron/admin auth — refuse anon JWT", () => {
  it("admin-auth expose requireServiceRoleOrStaff / OrAdmin et bloque anon", () => {
    const auth = source("supabase/functions/_shared/admin-auth.ts");
    expect(auth).toContain("export async function requireServiceRoleOrStaff");
    expect(auth).toContain("export async function requireServiceRoleOrAdmin");
    expect(auth).toContain("Forbidden: anon key is not sufficient");
    expect(auth).toContain("readJwtRoleClaim");
    expect(auth).toContain('=== "anon"');
    expect(auth).toContain('=== "service_role"');
    // Pas de doublon Lovable/Cursor après merge (sinon Deno refuse le module).
    expect(auth.match(/export async function requireServiceRoleOrStaff/g)).toHaveLength(1);
    expect(auth.match(/export async function requireServiceRoleOrAdmin/g)).toHaveLength(1);
    expect(auth.match(/export function requireServiceRoleOrStaff/g)).toBeNull();
    expect(auth.match(/export function requireServiceRoleOrAdmin/g)).toBeNull();
  });

  it("finding #1 process-intake-outreach exige admin ou service_role", () => {
    const edge = source("supabase/functions/process-intake-outreach/index.ts");
    expect(edge).toContain("requireServiceRoleOrAdmin");
    expect(edge).toContain('from "../_shared/admin-auth.ts"');
  });

  it("finding #2 send-inscription-documents exige staff ou service_role", () => {
    const edge = source("supabase/functions/send-inscription-documents/index.ts");
    expect(edge).toContain("requireServiceRoleOrStaff");
  });

  it("findings #3 #4 #5 #6 #7 crons digest/reminders/charges exigent staff ou service_role", () => {
    for (const path of [
      "supabase/functions/process-invoice-reminders/index.ts",
      "supabase/functions/process-schedule-reminders/index.ts",
      "supabase/functions/process-survey-reminders/index.ts",
      "supabase/functions/send-daily-ops-digest/index.ts",
      "supabase/functions/generate-monthly-charges/index.ts",
    ]) {
      const edge = source(path);
      expect(edge).toContain("requireServiceRoleOrStaff");
    }
  });

  it("finding #8 send-rosiere-cfp-request exige staff ou service_role", () => {
    const edge = source("supabase/functions/send-rosiere-cfp-request/index.ts");
    expect(edge).toContain("requireServiceRoleOrStaff");
    expect(edge).toContain('from "../_shared/admin-auth.ts"');
  });

  it("finding #11 upload-registration-document refuse studentId sans staff", () => {
    const edge = source("supabase/functions/upload-registration-document/index.ts");
    expect(edge).toContain("requireServiceRoleOrStaff");
    expect(edge).toContain('ownerSegment = "register"');
    expect(edge).toContain("requestedStudentId");
  });

  it("config.toml déclare verify_jwt sur les fonctions cron concernées", () => {
    const cfg = source("supabase/config.toml");
    expect(cfg).toContain("[functions.process-invoice-reminders]");
    expect(cfg).toContain("[functions.process-schedule-reminders]");
    expect(cfg).toContain("[functions.process-survey-reminders]");
    expect(cfg).toContain("[functions.generate-monthly-charges]");
    expect(cfg).toContain("[functions.send-inscription-documents]");
    expect(cfg).toContain("[functions.send-training-completion-pack]");
    expect(cfg).toContain("[functions.send-daily-ops-digest]");
    expect(cfg).toContain("[functions.process-intake-outreach]");
    expect(cfg).toContain("[functions.send-rosiere-cfp-request]");
  });

  it("send-training-completion-pack exige staff ou service_role", () => {
    const edge = source(
      "supabase/functions/send-training-completion-pack/index.ts"
    );
    expect(edge).toContain("requireServiceRoleOrStaff");
  });
});

describe("submit-registration — prix serveur + pas d'écrasement stagiaire", () => {
  const edge = source("supabase/functions/submit-registration/index.ts");

  it("finding #9 ne lit plus registration.price comme source de vérité", () => {
    expect(edge).toContain("ne jamais faire confiance au prix client");
    expect(edge).not.toMatch(/let price:\s*number\s*\|\s*null\s*=\s*registration\.price/);
    expect(edge).toContain("resolveOfferingPrice");
    expect(edge).toContain("pricing_rules");
  });

  it("finding #10 ne met plus à jour un stagiaire existant depuis le formulaire public", () => {
    expect(edge).toContain("sans écraser les coordonnées");
    // Pas d'update students sur la branche existingStudent.
    expect(edge).not.toMatch(
      /if \(studentId\) \{\s*await supabase\s*\.from\("students"\)\s*\.update/
    );
  });
});

describe("activate_season — staff only", () => {
  it("finding #14 migration exige is_staff()", () => {
    const mig = source(
      "supabase/migrations/20261013120000_activate_season_staff_only.sql"
    );
    expect(mig).toContain("is_staff()");
    expect(mig).toContain("REVOKE ALL ON FUNCTION public.activate_season");
    expect(mig).toContain("GRANT EXECUTE ON FUNCTION public.activate_season(uuid) TO authenticated");
  });
});

describe("restes faibles sécurité — attendance / stripe / FIF-PL", () => {
  it("compute_attendance_rate exige staff, stagiaire propriétaire ou formateur du créneau", () => {
    const mig = source(
      "supabase/migrations/20261013160000_compute_attendance_rate_auth.sql"
    );
    expect(mig).toContain("is_staff()");
    expect(mig).toContain("get_my_student_id()");
    expect(mig).toContain("get_my_instructor_id()");
    expect(mig).toContain("Accès refusé au taux d''assiduité");
    expect(mig).toContain("REVOKE ALL ON FUNCTION public.compute_attendance_rate");
  });

  it("check-stripe-config exige staff et verify_jwt", () => {
    const edge = source("supabase/functions/check-stripe-config/index.ts");
    expect(edge).toContain("requireStaff");
    expect(edge).toContain('from "../_shared/admin-auth.ts"');
    const cfg = source("supabase/config.toml");
    expect(cfg).toMatch(
      /\[functions\.check-stripe-config\]\s*\nverify_jwt\s*=\s*true/
    );
  });

  it("coveredOnCourseEur utilise le prix serveur, pas registration.price", () => {
    const edge = source("supabase/functions/submit-registration/index.ts");
    expect(edge).toContain("serverCoursePrice");
    expect(edge).toContain("buildFifplFundingDetails(registration, price)");
    expect(edge).toContain("buildFundingDetails(registration, price)");
    expect(edge).not.toMatch(
      /const coursePrice\s*=\s*\n?\s*registration\.price/
    );
  });
});

describe("jeton cron dédié (sans Vault)", () => {
  it("admin-auth accepte x-cron-dispatch-token comparé à cron_dispatch_secret", () => {
    const auth = source("supabase/functions/_shared/admin-auth.ts");
    expect(auth).toContain('req.headers.get("x-cron-dispatch-token")');
    expect(auth).toContain('.from("cron_dispatch_secret")');
    expect(auth).toContain("Forbidden: invalid cron token");
  });
});

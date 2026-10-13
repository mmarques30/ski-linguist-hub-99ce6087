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

  it("findings #3 #4 #6 crons digest/reminders exigent staff ou service_role", () => {
    for (const path of [
      "supabase/functions/process-invoice-reminders/index.ts",
      "supabase/functions/process-schedule-reminders/index.ts",
      "supabase/functions/send-daily-ops-digest/index.ts",
    ]) {
      const edge = source(path);
      expect(edge).toContain("requireServiceRoleOrStaff");
    }
  });

  it("config.toml déclare verify_jwt sur les fonctions cron concernées", () => {
    const cfg = source("supabase/config.toml");
    expect(cfg).toContain("[functions.process-invoice-reminders]");
    expect(cfg).toContain("[functions.process-schedule-reminders]");
    expect(cfg).toContain("[functions.send-inscription-documents]");
    expect(cfg).toContain("[functions.send-daily-ops-digest]");
    expect(cfg).toContain("[functions.process-intake-outreach]");
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

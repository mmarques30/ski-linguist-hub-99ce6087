import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde anti-régression : après replay des migrations supabase/ (en tenant
 * compte de DROP TABLE CASCADE), aucune policy « Staff … » ne doit rester
 * USING (true) / WITH CHECK (true) sur les tables resserrées, et les
 * anciennes policies publiques C1–C3 doivent être absentes.
 */

type Policy = {
  usingTrue: boolean;
  checkTrue: boolean;
  toAnon: boolean;
  toAuth: boolean;
  toPublic: boolean;
  file: string;
};

function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => {
      const i = line.indexOf("--");
      return i >= 0 ? line.slice(0, i) : line;
    })
    .join("\n");
}

function replayPolicies(): Map<string, Policy> {
  const dir = join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const policies = new Map<string, Policy>();

  const key = (table: string, name: string) => `${table}::${name}`;

  for (const file of files) {
    const text = stripSqlComments(readFileSync(join(dir, file), "utf8"));
    const re =
      /DROP\s+TABLE\s+IF\s+EXISTS\s+(?:public\.)?(\w+)|DROP\s+TABLE\s+(?:public\.)?(\w+)|DROP\s+POLICY(?:\s+IF\s+EXISTS)?\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)|CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)([\s\S]*?);/gi;

    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m[1] || m[2]) {
        const table = (m[1] || m[2]).toLowerCase();
        for (const k of [...policies.keys()]) {
          if (k.startsWith(`${table}::`)) policies.delete(k);
        }
        continue;
      }
      if (m[3]) {
        policies.delete(key(m[4].toLowerCase(), m[3]));
        continue;
      }
      const name = m[5];
      const table = m[6].toLowerCase();
      const body = m[7];
      policies.set(key(table, name), {
        usingTrue: /USING\s*\(\s*true\s*\)/i.test(body),
        checkTrue: /WITH\s+CHECK\s*\(\s*true\s*\)/i.test(body),
        toAnon: /\bTO\s+anon\b/i.test(body),
        toAuth: /\bTO\s+authenticated\b/i.test(body),
        toPublic: !/\bTO\s+anon\b/i.test(body) && !/\bTO\s+authenticated\b/i.test(body),
        file,
      });
    }
  }

  return policies;
}

const STAFF_TABLES = [
  "prospects",
  "scheduled_reminders",
  "sessions",
  "session_enrollments",
  "ski_schools",
  "schools_invoice_policy",
  "email_templates",
  "email_models",
  "qualiopi_indicators",
] as const;

describe("RLS — policies résiduelles après migrations", () => {
  const policies = replayPolicies();

  it("inclut la migration de resserrement staff / orphelines", () => {
    const mig = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261102100000_securite_rls_tighten_staff_and_orphan_policies.sql"
      ),
      "utf8"
    );
    expect(mig).toContain("securite_rls_tighten_staff_orphan");
    expect(mig).toContain("public.is_staff()");
    expect(mig).toContain('REVOKE ALL ON FUNCTION public.notify_admins');
    expect(mig).toContain("rls_session_enrollments_select_student");
  });

  it("C1–C3 (policies publiques initiales) absentes après DROP TABLE CASCADE + DROP défensif", () => {
    for (const name of [
      "students::Public can view students",
      "inscriptions::Public can view inscriptions",
      "inscriptions::Anyone can insert inscriptions",
      "professional_profiles::Public can view professional_profiles",
      "professional_profiles::Anyone can insert professional_profiles",
    ]) {
      expect(policies.has(name), name).toBe(false);
    }
  });

  it("pas de Staff … USING/WITH CHECK (true) sur les tables CRUD resserrées", () => {
    const offenders: string[] = [];
    for (const [k, p] of policies) {
      const [table, policyName] = k.split("::");
      if (!STAFF_TABLES.includes(table as (typeof STAFF_TABLES)[number])) continue;
      if (!policyName.startsWith("Staff can ")) continue;
      if (p.usingTrue || p.checkTrue) offenders.push(`${k} (${p.file})`);
    }
    expect(offenders).toEqual([]);
  });

  it("seasons : view authentifiée n'est plus USING (true) seul", () => {
    const p = policies.get("seasons::Staff can view seasons");
    expect(p).toBeTruthy();
    expect(p!.usingTrue).toBe(false);
    expect(p!.file).toContain("20261102100000");
  });

  it("policies student orphelines remplacées par is_student()", () => {
    expect(policies.has("students::Students can view own student record")).toBe(
      false
    );
    expect(
      policies.has("satisfaction_surveys::Students can view own satisfaction_surveys")
    ).toBe(false);
    expect(
      policies.has("session_enrollments::Students can view own session_enrollments")
    ).toBe(false);
    expect(policies.has("sessions::Students can view enrolled sessions")).toBe(
      false
    );
    expect(
      policies.has("satisfaction_surveys::rls_satisfaction_surveys_select_student")
    ).toBe(true);
    expect(
      policies.has("session_enrollments::rls_session_enrollments_select_student")
    ).toBe(true);
  });

  it("students / inscriptions : pas de policy anon/public ouverte", () => {
    for (const [k, p] of policies) {
      if (!k.startsWith("students::") && !k.startsWith("inscriptions::")) continue;
      expect(p.toAnon, k).toBe(false);
      if (p.toPublic) {
        expect(p.usingTrue || p.checkTrue, k).toBe(false);
      }
    }
    expect(policies.get("students::rls_students_select_staff")).toBeTruthy();
    expect(policies.get("inscriptions::rls_inscriptions_select_staff")).toBeTruthy();
  });
});

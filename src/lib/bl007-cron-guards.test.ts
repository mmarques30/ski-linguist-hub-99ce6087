import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("BL-007 garde-fous crons", () => {
  it("migration pose origin + dry_run planifié + jobs inactifs", () => {
    const mig = source(
      "supabase/migrations/20260921150000_bl007_cron_guards.sql"
    );
    expect(mig).toContain("invoices.origin");
    expect(mig).toContain("import_historique");
    expect(mig).toContain("email_crons_live");
    expect(mig).toContain("email_crons_dispatch_query");
    expect(mig).toContain("?dry_run=true");
    expect(mig).toContain("active := false");
  });

  it("process-invoice-reminders ignore l'import et journalise dry_run", () => {
    const edge = source(
      "supabase/functions/process-invoice-reminders/index.ts"
    );
    expect(edge).toContain(".eq('origin', 'app')");
    expect(edge).toContain("status: 'dry_run'");
    expect(edge).toContain("byRecipientType");
    expect(edge).toContain("[FLI][ESSAI] Relances facture");
  });

  it("import CSV historique marque origin=import_historique", () => {
    const lib = source("src/lib/fli-invoices-csv-import.ts");
    expect(lib).toContain('origin: "import_historique"');
  });

  it("création app pose origin=app", () => {
    const hook = source("src/hooks/useInvoices.ts");
    expect(hook).toContain('origin: "app"');
  });

  it("TESTING_GUIDE n'interdit plus toute activation de cron", () => {
    const guide = source("docs/TESTING_GUIDE.md");
    expect(guide).not.toMatch(/Ne pas activer de cron\.?$/m);
    expect(guide).toContain("email_crons_live");
    expect(guide).toContain("ZZTEST");
    expect(guide).toContain("J-11");
  });
});

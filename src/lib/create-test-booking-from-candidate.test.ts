import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261109160000_create_test_booking_from_candidate.sql"
  ),
  "utf8"
);

describe("create_test_booking_from_candidate", () => {
  it("reste SECURITY DEFINER et réservé staff", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("is_staff()");
    expect(migration).toContain("pending_payment");
    expect(migration).toContain("'confirmed'");
    expect(migration).toContain("'online_form'");
    expect(migration).not.toMatch(/status,\s*'completed'/);
  });

  it("refuse une réservation active existante", () => {
    expect(migration).toContain("Une réservation active existe déjà pour ce candidat");
    expect(migration).toContain("'pending_payment', 'confirmed'");
  });

  it("redirige la notif /reserver-test vers le hub Demandes", () => {
    expect(migration).toContain("/tests-oraux?tab=demandes");
    expect(migration).not.toMatch(/notify_admins\([\s\S]*'\/tests'\s*\)/);
  });

  it("expose le hub et le dialogue de création", () => {
    const page = readFileSync(
      join(process.cwd(), "src/pages/tests-oraux/TestsOrauxPage.tsx"),
      "utf8"
    );
    const dialog = readFileSync(
      join(process.cwd(), "src/components/tests-oraux/CreateBookingFromDemandeDialog.tsx"),
      "utf8"
    );
    const app = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
    expect(page).toContain('value: "demandes"');
    expect(page).toContain("CreateBookingFromDemandeDialog");
    expect(dialog).toContain("useCreateBookingFromDemande");
    const hook = readFileSync(join(process.cwd(), "src/hooks/useTestDemands.ts"), "utf8");
    expect(hook).toContain("create_test_booking_from_candidate");
    expect(app).toContain("/tests-oraux");
  });
});

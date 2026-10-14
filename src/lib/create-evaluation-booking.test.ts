import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20261014140000_create_formateur_evaluation_booking.sql"
  ),
  "utf8"
);

describe("create_formateur_evaluation_booking", () => {
  it("reste SECURITY DEFINER et réservé formateur/staff", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("is_formateur() OR public.is_staff()");
    expect(migration).toContain("status");
    expect(migration).toContain("'completed'");
    expect(migration).toContain("'formateur_ui'");
    expect(migration).toContain("test_bookings_source_check");
  });

  it("ne pose pas sponsor_id = ski_school_id (FK partners)", () => {
    expect(migration).toContain("dsf_partner_id()");
    expect(migration).toContain("FROM public.partners p");
    expect(migration).not.toMatch(/v_sponsor_id\s*:=\s*p_ski_school_id/);
  });

  it("expose le bouton Nouvelle évaluation dans la liste formateur", () => {
    const list = readFileSync(
      join(process.cwd(), "src/pages/formateur/EvaluationsList.tsx"),
      "utf8"
    );
    expect(list).toContain("Nouvelle évaluation");
    expect(list).toContain("CreateEvaluationBookingDialog");
    expect(list).toContain("canCreateEvaluation");
  });
});

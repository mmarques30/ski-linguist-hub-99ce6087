import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("sessions Oz en Oisans confirmées", () => {
  it("seed + migration passent S07/S08 en open", () => {
    const seed = readFileSync(
      join(process.cwd(), "supabase/migrations/20260930120001_registration_sessions_seed.sql"),
      "utf8"
    );
    const mig = readFileSync(
      join(process.cwd(), "supabase/migrations/20261001120000_oz_en_oisans_sessions_open.sql"),
      "utf8"
    );

    const ozLines = seed
      .split("\n")
      .filter((l) => l.includes("'S07'") || l.includes("'S08'"));
    expect(ozLines.length).toBeGreaterThanOrEqual(2);
    for (const line of ozLines) {
      expect(line).toContain("oz-en-oisans");
      expect(line).toMatch(/'open'/);
      expect(line).not.toMatch(/'waitlist'/);
    }

    expect(mig).toContain("S07");
    expect(mig).toContain("S08");
    expect(mig).toContain("enrollment_status = 'open'");
  });
});

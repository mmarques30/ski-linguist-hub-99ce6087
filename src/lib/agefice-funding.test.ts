import { describe, expect, it } from "vitest";
import {
  AGEFICE_CEILINGS_URL,
  AGEFICE_DOCUMENT_FILES,
  AGEFICE_INSCRIPTION_CHECKLIST,
  AGEFICE_MIN_DAYS_BEFORE_START,
  AGEFICE_PACK_DOCUMENTS,
  AGEFICE_REGISTER_COPY,
  ageficeDepositDeadlineIso,
  buildAgeficeObservation,
  formatAgeficeDepositDeadlineFr,
  isAgeficeFunding,
  isAgeficeFundingOrganization,
} from "./agefice-funding";

describe("agefice-funding", () => {
  it("expose le lien plafonds 2026 et les modèles PDF", () => {
    expect(AGEFICE_CEILINGS_URL).toContain("plafonds-financiers-annee-2026");
    expect(AGEFICE_DOCUMENT_FILES.demandePriseEnCharge).toMatch(/agefice-demande/);
    expect(AGEFICE_PACK_DOCUMENTS.filter((d) => d.phase === "inscription")).toHaveLength(2);
    expect(AGEFICE_INSCRIPTION_CHECKLIST.length).toBeGreaterThanOrEqual(5);
  });

  it("calcule la date limite de dépôt (≥ 15 j avant début)", () => {
    expect(ageficeDepositDeadlineIso("2026-11-30")).toBe("2026-11-15");
    expect(formatAgeficeDepositDeadlineFr("2026-11-30")).toBe("15/11/2026");
    expect(AGEFICE_MIN_DAYS_BEFORE_START).toBe(15);
  });

  it("détecte le financement AGEFICE", () => {
    expect(isAgeficeFunding("agefice")).toBe(true);
    expect(isAgeficeFunding("fifpl")).toBe(false);
    expect(isAgeficeFundingOrganization("AGEFICE")).toBe(true);
    expect(isAgeficeFundingOrganization("FIFPL")).toBe(false);
  });

  it("rédige l'observation BO et le texte confirmation", () => {
    const obs = buildAgeficeObservation({ startDate: "2026-11-30" });
    expect(obs).toContain("AGEFICE");
    expect(obs).toContain("15/11/2026");
    expect(obs).toContain(AGEFICE_CEILINGS_URL);
    expect(AGEFICE_REGISTER_COPY.confirmationAlert("2026-11-30")).toContain("15/11/2026");
  });

  it("garde la copie Deno d'accord avec le module front", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const front = readFileSync(join(process.cwd(), "src/lib/agefice-funding.ts"), "utf8");
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/agefice-funding.ts"),
      "utf8",
    );
    const strip = (s: string) => s.replace(/\s+/g, " ").trim();
    expect(strip(deno)).toBe(strip(front));
  });
});

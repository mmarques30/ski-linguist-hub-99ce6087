import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDailyOpsDigest,
  formatDailyOpsDigestSubject,
  formatDailyOpsDigestText,
  isOnlineModality,
  isOpsDigestNoise,
  isSchoolStation,
  type DigestInscriptionRow,
} from "./daily-ops-digest";

function row(partial: Partial<DigestInscriptionRow> & Pick<DigestInscriptionRow, "code" | "email">): DigestInscriptionRow {
  return {
    id: partial.id || "id-" + partial.code,
    code: partial.code,
    status: partial.status || "en_attente",
    created_at: partial.created_at || "2026-10-08T10:00:00Z",
    start_date: partial.start_date || "2026-11-30",
    end_date: partial.end_date || "2026-12-04",
    course_location: partial.course_location ?? "En ligne",
    modality: partial.modality ?? "en_ligne_individuel",
    language: partial.language ?? "Russe",
    funding_organization: partial.funding_organization ?? "FIFPL",
    payment_method: partial.payment_method ?? "stripe",
    price: partial.price ?? 900,
    deposit_amount: partial.deposit_amount ?? 150,
    balance_after_deposit: partial.balance_after_deposit ?? 750,
    documents_sent_at: partial.documents_sent_at ?? null,
    first_name: partial.first_name || "Ada",
    last_name: partial.last_name || "Lovelace",
    email: partial.email,
    amount_received: partial.amount_received ?? 0,
    deposit_received: partial.deposit_received ?? 0,
    amount_pending: partial.amount_pending ?? 0,
    cheque_pending: partial.cheque_pending ?? 0,
  };
}

describe("daily-ops-digest", () => {
  it("filtre ZZTEST et placeholders", () => {
    expect(isOpsDigestNoise({ first_name: "ZZTEST", last_name: "X", email: "a@b.fr" })).toBe(true);
    expect(
      isOpsDigestNoise({
        first_name: "A",
        last_name: "B",
        email: "x@example.invalid",
      }),
    ).toBe(true);
    expect(isOpsDigestNoise({ first_name: "Maud", last_name: "Gobert", email: "m@o.fr" })).toBe(false);
  });

  it("détecte en ligne et stations école", () => {
    expect(isOnlineModality("en_ligne", "Google Meet")).toBe(true);
    expect(isOnlineModality("presentiel", "Brides-les-Bains")).toBe(false);
    expect(isSchoolStation("ESF La Rosière")).toBe(true);
    expect(isSchoolStation("Méribel")).toBe(true);
    expect(isSchoolStation("Brides-les-Bains")).toBe(false);
  });

  it("signale dossier à envoyer après acompte et solde chèque en ligne", () => {
    const now = new Date("2026-10-09T08:00:00Z");
    const digest = buildDailyOpsDigest(
      [
        row({
          code: "FLI-260036",
          email: "tristan@example.com",
          deposit_received: 150,
          amount_received: 150,
          documents_sent_at: null,
          start_date: "2026-11-03",
          modality: "en_ligne_groupe",
        }),
        row({
          code: "FLI-260037",
          email: "nat@example.com",
          first_name: "Nathalie",
          last_name: "Bouvier",
          deposit_received: 150,
          amount_received: 150,
          cheque_pending: 750,
          balance_after_deposit: 750,
          documents_sent_at: "2026-10-08T13:00:00Z",
          start_date: "2026-10-13",
        }),
      ],
      now,
    );

    expect(digest.actions.some((a) => a.code === "FLI-260036" && /envoyer dossier/i.test(a.label))).toBe(true);
    expect(digest.actions.some((a) => a.code === "FLI-260037" && /attendre chèque/i.test(a.label))).toBe(true);
    expect(formatDailyOpsDigestSubject(digest)).toMatch(/Digest ops/i);
    expect(formatDailyOpsDigestText(digest)).toContain("ACTIONS À RÉALISER");
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = readFileSync(join(process.cwd(), "src/lib/daily-ops-digest.ts"), "utf8");
    const deno = readFileSync(
      join(process.cwd(), "supabase/functions/_shared/daily-ops-digest.ts"),
      "utf8",
    );
    for (const symbol of [
      "buildDailyOpsDigest",
      "formatDailyOpsDigestHtml",
      "formatDailyOpsDigestSubject",
      "isSchoolStation",
      "isOnlineModality",
    ]) {
      expect(front).toContain(`export function ${symbol}`);
      expect(deno).toContain(`export function ${symbol}`);
    }
    // Corps des fonctions exportées (hors commentaire d'en-tête)
    const stripHeader = (s: string) => s.replace(/^\/\*\*[\s\S]*?\*\/\n/, "");
    expect(stripHeader(deno)).toBe(stripHeader(front));
  });
});

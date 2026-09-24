import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRegistrationAdminNotifyHtml,
  buildRegistrationAdminNotifyMessage,
  buildRegistrationAdminNotifySubject,
  buildRegistrationAdminNotifyTitle,
  registrationAdminSummaryLines,
  type RegistrationAdminSummaryInput,
} from "./registration-admin-notify";

const sample: RegistrationAdminSummaryInput = {
  firstName: "Cassandre",
  lastName: "Viard Gaudin",
  email: "cassandre.lore@gmail.com",
  phone: "06 00 00 00 00",
  language: "Anglais",
  modalityLabel: "En ligne — cours individuel",
  fundingLabel: "FIFPL",
  level: "A2",
  slopeLabel: "Piste bleue",
  durationHours: 18,
  courseLocation: "Google Meet",
  datesLabel: "du 1er octobre 2026 au 15 décembre 2026",
  paymentLabel: "Chèque (acompte)",
  inscriptionCode: "FLI-261234",
  price: 900,
};

describe("registration-admin-notify", () => {
  it("garde la copie Deno d'accord avec le module front", () => {
    const front = readFileSync(
      join(process.cwd(), "src/lib/registration-admin-notify.ts"),
      "utf8"
    );
    const deno = readFileSync(
      join(
        process.cwd(),
        "supabase/functions/_shared/registration-admin-notify.ts"
      ),
      "utf8"
    );
    const stripHeader = (s: string) =>
      s
        .replace(/\/\*\*[\s\S]*?\*\//, "")
        .replace(/\s+/g, " ")
        .trim();
    expect(stripHeader(deno)).toBe(stripHeader(front));
  });

  it("résume nom, prénom, choix et niveau", () => {
    const lines = registrationAdminSummaryLines(sample);
    const byLabel = Object.fromEntries(lines.map((l) => [l.label, l.value]));
    expect(byLabel["Nom"]).toBe("Viard Gaudin");
    expect(byLabel["Prénom"]).toBe("Cassandre");
    expect(byLabel["Langue"]).toBe("Anglais");
    expect(byLabel["Modalité"]).toBe("En ligne — cours individuel");
    expect(byLabel["Financement"]).toBe("FIFPL");
    expect(byLabel["Niveau"]).toBe("A2");
  });

  it("sujet et titre sans alerte test faible", () => {
    expect(buildRegistrationAdminNotifySubject(sample)).toBe(
      "[FLI] Nouvelle inscription — Cassandre Viard Gaudin"
    );
    expect(buildRegistrationAdminNotifyTitle(sample)).toBe(
      "Nouvelle inscription — Cassandre Viard Gaudin"
    );
    expect(buildRegistrationAdminNotifyMessage(sample)).toContain("niveau A2");
    expect(buildRegistrationAdminNotifyHtml(sample)).toContain("Cassandre");
    expect(buildRegistrationAdminNotifyHtml(sample)).not.toContain("ALERTE");
  });

  it("marque OPCO / devis dans le sujet", () => {
    expect(
      buildRegistrationAdminNotifySubject({ ...sample, isOpco: true })
    ).toContain("OPCO");
    expect(
      buildRegistrationAdminNotifySubject({
        ...sample,
        isCustomFormat: true,
        customFormatDetails: "12 h le soir",
      })
    ).toContain("devis");
  });
});

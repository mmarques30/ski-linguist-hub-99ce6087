import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORMATEUR_CONTRACT_SIGNATURE_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_FALLBACK,
  buildInstructorContractPdf,
  formatContractDateFr,
  instructorContractFilename,
} from "./instructor-contract-pdf";

const ROOT = join(process.cwd());

function loadSignature(): Uint8Array {
  const primary = join(ROOT, "public", FORMATEUR_CONTRACT_SIGNATURE_ASSET);
  try {
    return new Uint8Array(readFileSync(primary));
  } catch {
    return new Uint8Array(
      readFileSync(join(ROOT, "public", FORMATEUR_CONTRACT_SIGNATURE_FALLBACK)),
    );
  }
}

describe("instructor-contract-pdf", () => {
  it("formate les dates ISO en FR", () => {
    expect(formatContractDateFr("2026-11-16")).toBe("16/11/2026");
  });

  it("nomme le PDF avec le numéro de contrat", () => {
    expect(instructorContractFilename("CTR-2026-0011", "Tulio Rezende")).toBe(
      "Contrat-CTR-2026-0011-Tulio-Rezende.pdf",
    );
  });

  it("génère un PDF non vide avec signature organisme", async () => {
    const pdf = await buildInstructorContractPdf({
      contractNumber: "CTR-2026-0011",
      prestataireLine:
        "Monsieur Tulio Rezende Ferreira Moura, auto-entrepreneur, SIRET 993 150 960 00017, 25 avenue de la Gare, 73800 Montmélian — tuliorfmoura@gmail.com — 07 45 19 75 89",
      languageLabel: "portugais",
      studentFullName: "Jay Deleglise",
      studentEmail: "jay.deleglise@gmail.com",
      studentPhone: "+33 6 45 61 32 81",
      inscriptionCode: "FLI-260048",
      durationHours: 12,
      hourlyRate: 30,
      startDate: "2026-11-16",
      endDate: "2027-03-16",
      locationLabel: "En ligne (Google Meet)",
      organismSignaturePng: loadSignature(),
      issuedAtLabel: "09/11/2026",
    });
    expect(pdf.byteLength).toBeGreaterThan(2000);
    expect(Buffer.from(pdf).subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});

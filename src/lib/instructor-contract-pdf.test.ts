import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORMATEUR_CONTRACT_LETTERHEAD_ASSET,
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

function loadLetterhead(): Uint8Array {
  return new Uint8Array(
    readFileSync(join(ROOT, "public", FORMATEUR_CONTRACT_LETTERHEAD_ASSET)),
  );
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

  it("génère un PDF individuel en ligne avec en-tête + signature organisme", async () => {
    const letterhead = loadLetterhead();
    const withHeader = await buildInstructorContractPdf({
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
      letterheadPng: letterhead,
      issuedAtLabel: "09/11/2026",
    });
    const withoutHeader = await buildInstructorContractPdf({
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
    expect(withHeader.byteLength).toBeGreaterThan(2000);
    expect(Buffer.from(withHeader).subarray(0, 4).toString("ascii")).toBe("%PDF");
    // Le PNG d'en-tête grossit le PDF vs fallback texte seul
    expect(withHeader.byteLength).toBeGreaterThan(withoutHeader.byteLength);
    expect(Buffer.from(withHeader).equals(Buffer.from(withoutHeader))).toBe(false);
  });

  it("génère un PDF stage en station (présentiel collectif) avec en-tête + signature", async () => {
    const letterhead = loadLetterhead();
    const online = await buildInstructorContractPdf({
      contractNumber: "CTR-2026-0011",
      prestataireLine:
        "Monsieur Tulio Rezende Ferreira Moura, auto-entrepreneur, SIRET 993 150 960 00017, 25 avenue de la Gare, 73800 Montmélian — tuliorfmoura@gmail.com — 07 45 19 75 89",
      languageLabel: "portugais",
      studentFullName: "Jay Deleglise",
      studentEmail: "jay.deleglise@gmail.com",
      inscriptionCode: "FLI-260048",
      durationHours: 12,
      hourlyRate: 30,
      startDate: "2026-11-16",
      endDate: "2027-03-16",
      organismSignaturePng: loadSignature(),
      letterheadPng: letterhead,
      issuedAtLabel: "09/11/2026",
    });
    const station = await buildInstructorContractPdf({
      contractNumber: "CTR-2026-0017",
      prestataireLine:
        "Monsieur Tulio Rezende Ferreira Moura, auto-entrepreneur, SIRET 993 150 960 00017, 25 avenue de la Gare, 73800 Montmélian — tuliorfmoura@gmail.com — 07 45 19 75 89",
      languageLabel: "portugais",
      modality: "station_group",
      missionLabel: "Stage Portugais Bresilien — ESF Val d'Isere",
      volumeNote:
        "2 groupes — 24 h stagiaires : 16 h lun.–jeu. + 8 h vendredi",
      durationHours: 40,
      hourlyRate: 30,
      startDate: "2026-11-23",
      endDate: "2026-11-27",
      locationLabel: "Val d'Isere",
      organismSignaturePng: loadSignature(),
      letterheadPng: letterhead,
      issuedAtLabel: "17/11/2026",
    });
    expect(station.byteLength).toBeGreaterThan(2000);
    expect(Buffer.from(station).subarray(0, 4).toString("ascii")).toBe("%PDF");
    // Contenu distinct du modèle en ligne (heures / total différents)
    expect(Buffer.from(station).equals(Buffer.from(online))).toBe(false);
  });
});

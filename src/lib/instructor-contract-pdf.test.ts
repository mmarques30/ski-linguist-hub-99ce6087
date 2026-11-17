import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  FORMATEUR_CONTRACT_FOOTER_LINES,
  FORMATEUR_CONTRACT_LETTERHEAD_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_FALLBACK,
  buildInstructorContractPdf,
  buildPrestataireAddressLines,
  formatContractDateFr,
  formatEuroFr,
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

async function countPdfPages(pdf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdf);
  return doc.getPageCount();
}

describe("instructor-contract-pdf", () => {
  it("formate les dates ISO en FR", () => {
    expect(formatContractDateFr("2026-11-16")).toBe("16/11/2026");
  });

  it("formate les montants en FR", () => {
    expect(formatEuroFr(1200).replace(/\u202f|\u00a0/g, " ")).toBe("1 200,00 €");
  });

  it("nomme le PDF avec le numéro de contrat", () => {
    expect(instructorContractFilename("CTR-2026-0011", "Tulio Rezende")).toBe(
      "Contrat-CTR-2026-0011-Tulio-Rezende.pdf",
    );
  });

  it("expose le pied de page légal FLI", () => {
    expect(FORMATEUR_CONTRACT_FOOTER_LINES[0]).toContain(
      "Formation Professionnelle Continue",
    );
    expect(FORMATEUR_CONTRACT_FOOTER_LINES[2]).toContain("484 772 041 00048");
  });

  it("construit les lignes d'adresse prestataire", () => {
    const lines = buildPrestataireAddressLines({
      address: "25 avenue de la Gare",
      postalCode: "73800",
      city: "Montmélian",
      siret: "99315096000017",
      email: "tuliorfmoura@gmail.com",
      phone: "07 45 19 75 89",
      statutLabel: "auto-entrepreneur",
    });
    expect(lines[0]).toBe("25 avenue de la Gare");
    expect(lines.join(" ")).toContain("993 150 960 00017");
  });

  it("génère un PDF multi-pages avec en-tête + pied + clauses du modèle", async () => {
    const letterhead = loadLetterhead();
    const pdf = await buildInstructorContractPdf({
      contractNumber: "CTR-2026-0011",
      prestataireCiviliteName: "Monsieur Tulio Rezende Ferreira Moura",
      prestataireAddressLines: buildPrestataireAddressLines({
        address: "25 avenue de la Gare",
        postalCode: "73800",
        city: "Montmélian",
        siret: "99315096000017",
        email: "tuliorfmoura@gmail.com",
        phone: "07 45 19 75 89",
        statutLabel: "auto-entrepreneur",
      }),
      formationNature: "Formation en ligne Jay Deleglise",
      durationHours: 12,
      hourlyRate: 30,
      startDate: "2026-11-16",
      endDate: "2027-03-16",
      locationLabel: "En ligne (Google Meet)",
      organismSignaturePng: loadSignature(),
      letterheadPng: letterhead,
      issuedAtLabel: "09/11/2026",
      prestataireSignName: "Tulio Rezende Ferreira Moura",
    });
    expect(Buffer.from(pdf).subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(50_000);
    expect(await countPdfPages(pdf)).toBeGreaterThanOrEqual(3);
  });

  it("génère un PDF stage station distinct (volume / lieu)", async () => {
    const letterhead = loadLetterhead();
    const base = {
      prestataireCiviliteName: "Monsieur Tulio Rezende Ferreira Moura",
      prestataireAddressLines: buildPrestataireAddressLines({
        address: "25 avenue de la Gare",
        postalCode: "73800",
        city: "Montmélian",
        siret: "99315096000017",
      }),
      organismSignaturePng: loadSignature(),
      letterheadPng: letterhead,
      issuedAtLabel: "17/11/2026",
      prestataireSignName: "Tulio Rezende Ferreira Moura",
    };
    const online = await buildInstructorContractPdf({
      ...base,
      contractNumber: "CTR-2026-0011",
      formationNature: "Formation en ligne Jay Deleglise",
      durationHours: 12,
      hourlyRate: 30,
      startDate: "2026-11-16",
      endDate: "2027-03-16",
      locationLabel: "En ligne (Google Meet)",
      modality: "online_individual",
    });
    const station = await buildInstructorContractPdf({
      ...base,
      contractNumber: "CTR-2026-0017",
      formationNature: "Stage Portugais Brésilien — ESF Val d'Isère",
      volumeNote:
        "2 groupes — 24 h stagiaires : 16 h lun.–jeu. + 8 h vendredi par groupe",
      durationHours: 40,
      hourlyRate: 30,
      startDate: "2026-11-23",
      endDate: "2026-11-27",
      locationLabel: "Val d'Isère",
      modality: "station_group",
    });
    expect(await countPdfPages(station)).toBeGreaterThanOrEqual(3);
    expect(Buffer.from(station).equals(Buffer.from(online))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  attestationPresenceFilename,
  buildAttestationPresencePath,
  buildAttestationPresencePdfBytes,
  demiJourneesFromHoursIndividuelle,
  FIFPL_ATTESTATION_TEMPLATE_PUBLIC_PATH,
  fifplFormationTitle,
  formatFifplAttestationDate,
  inferFormationKindFifpl,
  resolvePartie1Duration,
} from "./attestation-presence-pdf";

const templateBytes = new Uint8Array(
  readFileSync(
    join(process.cwd(), "public", FIFPL_ATTESTATION_TEMPLATE_PUBLIC_PATH)
  )
);

describe("attestation-presence-pdf", () => {
  it("builds a stable storage path and filename", () => {
    expect(attestationPresenceFilename("FLI-260099")).toBe(
      "Attestation-presence-FLI-260099.pdf"
    );
    expect(
      buildAttestationPresencePath("stu", "ins", "FLI-260099")
    ).toBe("stu/ins/Attestation-presence-FLI-260099.pdf");
  });

  it("formats dates FR and computes demi-journées individuelles (heures/3)", () => {
    expect(formatFifplAttestationDate("2026-09-16")).toBe("16/09/2026");
    expect(demiJourneesFromHoursIndividuelle(18)).toBe(6);
    expect(demiJourneesFromHoursIndividuelle(20)).toBe(7);
    expect(
      resolvePartie1Duration({
        formationKind: "individuelle",
        totalHours: 18,
      })
    ).toEqual({ joursEntiers: "", demiJournees: "6", totalHours: "18" });
  });

  it("collective : pas d'auto-calcul, suit la convention", () => {
    expect(
      resolvePartie1Duration({
        formationKind: "collective",
        totalHours: 30,
        joursEntiersConvention: 4,
        demiJourneesConvention: 2,
      })
    ).toEqual({ joursEntiers: "4", demiJournees: "2", totalHours: "30" });
    expect(
      resolvePartie1Duration({
        formationKind: "collective",
        totalHours: 30,
      })
    ).toEqual({ joursEntiers: "", demiJournees: "", totalHours: "30" });
  });

  it("infère individuelle pour l'en ligne (pas e-learning)", () => {
    expect(
      inferFormationKindFifpl({ modality: "en_ligne" })
    ).toBe("individuelle");
    expect(
      inferFormationKindFifpl({ courseType: "Collective station" })
    ).toBe("collective");
    expect(fifplFormationTitle("Anglais", "individuelle")).toBe(
      "Formation individualisée en Anglais"
    );
  });

  it("produit un PDF sur le modèle officiel avec 6 demi-journées / 18 h / 900 €", async () => {
    const bytes = await buildAttestationPresencePdfBytes({
      studentName: "Montaine Gros-Deleglise",
      language: "Anglais",
      startDate: "2026-09-16",
      endDate: "2026-10-07",
      durationHoursPlanned: 18,
      hoursFollowed: 18,
      attendanceRate: 100,
      locationOrModality: "en_ligne",
      formateurName: "Maxime Goy",
      inscriptionCode: "FLI-260099",
      issueDate: "2026-10-09",
      fundingOrganization: "FIFPL",
      amountHt: 900,
      amountTtc: 900,
      formationKind: "individuelle",
      templateBytes,
    });
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(20_000);

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    // Le modèle officiel reste la base (1 page A4).
    const page = doc.getPage(0);
    expect(Math.round(page.getWidth())).toBe(595);
    expect(Math.round(page.getHeight())).toBe(842);
  });
});

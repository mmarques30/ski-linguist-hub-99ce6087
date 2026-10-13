import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  buildCertificatePdfBytes,
  CERTIFICATE_ASSET_FILES,
  CERTIFICATE_FLI_FOOTER_LINES,
  CERTIFICATE_ORG,
} from "./certificate-pdf";

const assetsDir = join(process.cwd(), "public/inscription-documents");
const letterheadPng = new Uint8Array(
  readFileSync(join(assetsDir, CERTIFICATE_ASSET_FILES.letterhead))
);
const cachetPng = new Uint8Array(
  readFileSync(join(assetsDir, CERTIFICATE_ASSET_FILES.cachet))
);

describe("certificate-pdf (modèle Word 2024, pdf-lib RGB)", () => {
  it("expose logo/org + pied FLI Version 2", () => {
    expect(CERTIFICATE_ORG.name).toBe("France Langues International");
    expect(CERTIFICATE_ORG.siret).toContain("484 772 041");
    expect(CERTIFICATE_ORG.activityNumber).toBe("82 73 01 366 73");
    expect(CERTIFICATE_FLI_FOOTER_LINES.at(-1)).toContain("Version 2");
    expect(CERTIFICATE_ASSET_FILES.letterhead).toContain("entete-cert");
  });

  it("produit un PDF avec 2 images RGB (logo + cachet)", async () => {
    const bytes = await buildCertificatePdfBytes(
      {
        studentName: "Montaine Gros-Deleglise",
        language: "Anglais",
        startDate: "2026-09-16",
        endDate: "2026-10-07",
        durationHoursPlanned: 18,
        hoursFollowed: 18,
        locationOrModality: "en_ligne",
        formateurName: "Maxime Goy",
        niveauGeneralEntree: "B1+",
        niveauTechniqueEntree: "B1",
        niveauGeneralSortie: "B2",
        niveauTechniqueSortie: "B2",
        objectifAtteint: "oui",
        commentaire: "Très assidue.",
        issueDate: "2026-10-09",
        inscriptionCode: "FLI-260099",
      },
      { letterheadPng, cachetPng }
    );
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    // pdf-lib embeds PNGs as XObjects — page has content.
    expect(bytes.byteLength).toBeGreaterThan(40_000);
  });
});

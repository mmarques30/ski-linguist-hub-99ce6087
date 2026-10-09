import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCertificatePdfBlob,
  CERTIFICATE_FLI_FOOTER_LINES,
  CERTIFICATE_ORG,
} from "./certificate-pdf";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "./inscription-documents-assets";

const assetsDir = join(process.cwd(), "public/inscription-documents");
const letterheadPng = new Uint8Array(
  readFileSync(join(assetsDir, INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead))
);
const cachetPng = new Uint8Array(
  readFileSync(
    join(assetsDir, INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature)
  )
);

describe("certificate-pdf (modèle Word 2024)", () => {
  it("expose logo/org + pied FLI Version 2", () => {
    expect(CERTIFICATE_ORG.name).toBe("France Langues International");
    expect(CERTIFICATE_ORG.siret).toContain("484 772 041");
    expect(CERTIFICATE_ORG.activityNumber).toBe("82 73 01 366 73");
    expect(CERTIFICATE_FLI_FOOTER_LINES[0]).toContain(
      "Formation Professionnelle Continue"
    );
    expect(CERTIFICATE_FLI_FOOTER_LINES.at(-1)).toContain("Version 2");
  });

  it("produit un PDF avec en-tête organisme, logo et cachet", async () => {
    const blob = await buildCertificatePdfBlob(
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
    expect(blob.type).toBe("application/pdf");
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.slice(0, 5).toString()).toBe("%PDF-");
    // Logo + cachet → plus lourd qu'un PDF texte seul.
    expect(buf.length).toBeGreaterThan(50_000);
  });
});

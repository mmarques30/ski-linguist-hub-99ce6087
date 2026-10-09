import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCertificatePdfBlob,
  CERTIFICATE_FLI_FOOTER_LINES,
} from "./certificate-pdf";
import { INSCRIPTION_DOCUMENT_ASSET_FILES } from "./inscription-documents-assets";

const letterheadPng = new Uint8Array(
  readFileSync(
    join(
      process.cwd(),
      "public/inscription-documents",
      INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead
    )
  )
);

describe("certificate-pdf (modèle Word 2024)", () => {
  it("expose le pied FLI Version 2 du modèle Word", () => {
    expect(CERTIFICATE_FLI_FOOTER_LINES[0]).toContain(
      "Formation Professionnelle Continue"
    );
    expect(CERTIFICATE_FLI_FOOTER_LINES.at(-1)).toContain("Version 2");
  });

  it("produit un PDF avec en-tête letterhead et contenu d'assiduité", async () => {
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
      { letterheadPng }
    );
    expect(blob.type).toBe("application/pdf");
    const buf = Buffer.from(await blob.arrayBuffer());
    expect(buf.slice(0, 5).toString()).toBe("%PDF-");
    // Letterhead + texte → plus lourd qu'un PDF texte seul.
    expect(buf.length).toBeGreaterThan(20_000);
  });
});

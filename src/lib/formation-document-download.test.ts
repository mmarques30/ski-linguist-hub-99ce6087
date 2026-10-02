import { describe, expect, it } from "vitest";
import {
  getStaticFormationDocumentPublicUrl,
  isGeneratedFormationDocument,
  resolveFormationDocumentDownload,
} from "./formation-document-download";

describe("formation-document-download", () => {
  it("résout un PDF déjà stocké", () => {
    expect(
      resolveFormationDocumentDownload({
        id: "a",
        document_type: "CONVENTION",
        pdf_url: "student/inscription/Convention.pdf",
      }),
    ).toEqual({
      kind: "stored",
      pathOrUrl: "student/inscription/Convention.pdf",
    });
  });

  it("bascule sur l'URL publique pour les PDF statiques", () => {
    expect(getStaticFormationDocumentPublicUrl("REGLEMENT")).toBe(
      "/registration-documents/criteres-prise-en-charge-2026.pdf",
    );
    expect(getStaticFormationDocumentPublicUrl("LIVRET")).toBe(
      "/registration-documents/tutoriel-fif-pl-fli.pdf",
    );
    expect(getStaticFormationDocumentPublicUrl("AGEFICE_DEMANDE")).toContain(
      "agefice-demande",
    );
    expect(
      resolveFormationDocumentDownload({
        id: "b",
        document_type: "REGLEMENT",
        pdf_url: null,
      }),
    ).toEqual({
      kind: "static",
      publicUrl: "/registration-documents/criteres-prise-en-charge-2026.pdf",
    });
  });

  it("demande une publication pour convention / programme sans pdf_url", () => {
    expect(isGeneratedFormationDocument("CONVENTION")).toBe(true);
    expect(isGeneratedFormationDocument("PROGRAMME")).toBe(true);
    expect(isGeneratedFormationDocument("REGLEMENT")).toBe(false);
    expect(
      resolveFormationDocumentDownload({
        id: "c",
        document_type: "PROGRAMME",
        pdf_url: null,
      }),
    ).toEqual({ kind: "publish", documentSendingId: "c" });
  });
});

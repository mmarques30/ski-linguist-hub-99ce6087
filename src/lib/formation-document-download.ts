/**
 * Téléchargement des documents de formation (convention, programme, pack FIF-PL / AGEFICE).
 * Stratégie : PDF stocké (bucket privé) → sinon PDF statique public → sinon edge
 * `publish-inscription-documents` qui régénère / stocke puis signe.
 */

import {
  AGEFICE_WELCOME_DOCUMENTS,
  getRegistrationDocumentPublicUrl,
  REGISTRATION_WELCOME_DOCUMENTS,
} from "@/lib/registration-welcome-documents";

export const PUBLISH_INSCRIPTION_DOCUMENTS_FN = "publish-inscription-documents";

const STATIC_BY_TYPE = new Map(
  [...REGISTRATION_WELCOME_DOCUMENTS, ...AGEFICE_WELCOME_DOCUMENTS]
    .filter(
      (d): d is (typeof REGISTRATION_WELCOME_DOCUMENTS)[number] & {
        internalFile: string;
      } => d.delivery === "static_pdf" && Boolean(d.internalFile),
    )
    .map((d) => [d.documentType, d.internalFile] as const),
);

/** URL publique pour critères / tutoriel / formulaires AGEFICE (pas de signature). */
export function getStaticFormationDocumentPublicUrl(
  documentType: string,
): string | null {
  const internal = STATIC_BY_TYPE.get(documentType);
  return internal ? getRegistrationDocumentPublicUrl(internal) : null;
}

export function isGeneratedFormationDocument(documentType: string): boolean {
  const type = documentType.toUpperCase();
  return type === "CONVENTION" || type === "PROGRAMME";
}

export type FormationDocumentDownloadSource =
  | { kind: "stored"; pathOrUrl: string }
  | { kind: "static"; publicUrl: string }
  | { kind: "publish"; documentSendingId: string };

/** Choisit comment ouvrir le PDF côté UI. */
export function resolveFormationDocumentDownload(doc: {
  id: string;
  document_type: string;
  pdf_url: string | null;
}): FormationDocumentDownloadSource {
  if (doc.pdf_url) {
    return { kind: "stored", pathOrUrl: doc.pdf_url };
  }
  const publicUrl = getStaticFormationDocumentPublicUrl(doc.document_type);
  if (publicUrl) {
    return { kind: "static", publicUrl };
  }
  return { kind: "publish", documentSendingId: doc.id };
}

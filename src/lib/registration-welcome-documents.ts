export interface RegistrationWelcomeDocument {
  documentType: string;
  filename: string;
  internalFile: string;
  label: string;
}

export const REGISTRATION_WELCOME_DOCUMENTS: RegistrationWelcomeDocument[] = [
  {
    documentType: "REGLEMENT",
    filename: "Criteres de prise en charge Moniteurs de ski 2026.pdf",
    internalFile: "criteres-prise-en-charge-2026.pdf",
    label: "Critères de prise en charge Moniteurs de ski 2026",
  },
  {
    documentType: "CONVENTION",
    filename: "Convention 2025.dotx",
    internalFile: "convention-2025.dotx",
    label: "Convention de formation 2025",
  },
  {
    documentType: "PROGRAMME",
    filename: "Programme detaille 2025.docx",
    internalFile: "programme-detaille-2025.docx",
    label: "Programme détaillé 2025",
  },
];

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REGLEMENT: "Critères de prise en charge",
  CONVENTION: "Convention de formation",
  PROGRAMME: "Programme détaillé",
  LIVRET: "Livret",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  CERTIFICAT: "Certificat",
  FACTURE: "Facture",
};

export function getRegistrationDocumentPublicUrl(internalFile: string): string {
  return `/registration-documents/${internalFile}`;
}

export function isOnlineInscription(modality: string | null | undefined): boolean {
  if (!modality) return false;
  return (
    modality === "online_individual" ||
    modality === "online_group" ||
    modality === "en_ligne_individuel" ||
    modality === "en_ligne_groupe"
  );
}

export function expectsSkiMonitorWelcomePack(params: {
  modality?: string | null;
  courseLocation?: string | null;
  observations?: string | null;
}): boolean {
  const isOnline =
    isOnlineInscription(params.modality) ||
    (params.courseLocation?.toLowerCase().includes("ligne") ?? false);

  const isSkiInstructor =
    params.observations?.includes("Moniteur de ski") ?? false;

  return isOnline && isSkiInstructor;
}

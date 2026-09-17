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
    filename: "Convention Stage langues Station 2022.dotx",
    internalFile: "convention-stage-langues-station-2022.dotx",
    label: "Convention Stage langues Station 2022",
  },
  {
    documentType: "PROGRAMME",
    filename: "Contenu pedagogique Station 2022.dotx",
    internalFile: "contenu-pedagogique-station-2022.dotx",
    label: "Contenu pédagogique Station 2022",
  },
];

/** Préfixe storage (bucket `documents`, objets staff) pour les modèles remplaçables. */
export const REGISTRATION_TEMPLATE_STORAGE_PREFIX = "staff/registration-templates";

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REGLEMENT: "Critères de prise en charge",
  CONVENTION: "Convention Stage langues Station",
  PROGRAMME: "Contenu pédagogique Station",
  LIVRET: "Livret",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  CERTIFICAT: "Certificat de fin de formation",
  FACTURE: "Facture",
};

export function getRegistrationDocumentPublicUrl(internalFile: string): string {
  return `/registration-documents/${internalFile}`;
}

export function registrationTemplateStoragePath(internalFile: string): string {
  const safe = internalFile.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== internalFile) {
    throw new Error(`Nom de fichier modèle refusé : ${internalFile}`);
  }
  return `${REGISTRATION_TEMPLATE_STORAGE_PREFIX}/${safe}`;
}

export function isKnownRegistrationTemplate(internalFile: string): boolean {
  return REGISTRATION_WELCOME_DOCUMENTS.some((d) => d.internalFile === internalFile);
}

export function acceptMimeForTemplate(internalFile: string): string {
  if (internalFile.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (internalFile.toLowerCase().endsWith(".dotx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.template";
  }
  return "application/octet-stream";
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
  // The welcome pack goes to every ski instructor registration (all modalities).
  return params.observations?.includes("Moniteur de ski") ?? false;
}

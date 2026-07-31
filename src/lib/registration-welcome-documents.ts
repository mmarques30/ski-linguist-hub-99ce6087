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

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REGLEMENT: "Critères de prise en charge",
  CONVENTION: "Convention de stage",
  PROGRAMME: "Contenu pédagogique",
  LIVRET: "Livret",
  CONVOCATION: "Convocation",
  ATTESTATION_PRESENCE: "Attestation de présence",
  CERTIFICAT: "Certificat",
  FACTURE: "Facture",
};

export function getRegistrationDocumentPublicUrl(internalFile: string): string {
  return `/registration-documents/${internalFile}`;
}

export function expectsSkiMonitorWelcomePack(params: {
  observations?: string | null;
}): boolean {
  return params.observations?.includes("Moniteur de ski") ?? false;
}

import { getFundingFlow } from "./funding-flows";

export type RegistrationDocumentDelivery = "static_pdf" | "generated_pdf";

export interface RegistrationWelcomeDocument {
  documentType: string;
  /** Nom affiché / joint à l'e-mail (peut contenir un placeholder {code}). */
  filename: string;
  /**
   * Fichier livré avec l'app (critères / tutoriel). Null pour convention /
   * programme : PDF généré à l'envoi avec les données du stagiaire.
   */
  internalFile: string | null;
  label: string;
  delivery: RegistrationDocumentDelivery;
}

/**
 * Contenu du pack d'inscription moniteur (ce qui part réellement au stagiaire).
 * Convention et programme = PDF personnalisés — jamais les modèles Word vides.
 */
export const REGISTRATION_WELCOME_DOCUMENTS: RegistrationWelcomeDocument[] = [
  {
    documentType: "REGLEMENT",
    filename: "Criteres de prise en charge Moniteurs de ski 2026.pdf",
    internalFile: "criteres-prise-en-charge-2026.pdf",
    label: "Critères de prise en charge Moniteurs de ski 2026",
    delivery: "static_pdf",
  },
  {
    documentType: "CONVENTION",
    filename: "Convention-formation-{code}.pdf",
    internalFile: null,
    label: "Convention de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
  {
    documentType: "PROGRAMME",
    filename: "Programme-formation-{code}.pdf",
    internalFile: null,
    label: "Programme de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
  {
    documentType: "LIVRET",
    filename: "Tutoriel FIF-PL FLI.pdf",
    internalFile: "tutoriel-fif-pl-fli.pdf",
    label: "Tutoriel pour la demande de prise en charge FIF-PL",
    delivery: "static_pdf",
  },
];

/**
 * Pack autofinancement : convention + programme uniquement
 * (pas de critères FIF-PL / tutoriel / formulaire organisme).
 */
export const SELF_WELCOME_DOCUMENTS: RegistrationWelcomeDocument[] = [
  {
    documentType: "CONVENTION",
    filename: "Convention-formation-{code}.pdf",
    internalFile: null,
    label: "Convention de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
  {
    documentType: "PROGRAMME",
    filename: "Programme-formation-{code}.pdf",
    internalFile: null,
    label: "Programme de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
];

/**
 * Pack d'inscription AGEFICE : convention + programme personnalisés +
 * formulaire de demande + liste des pièces (pas les critères FIF-PL).
 */
export const AGEFICE_WELCOME_DOCUMENTS: RegistrationWelcomeDocument[] = [
  {
    documentType: "CONVENTION",
    filename: "Convention-formation-{code}.pdf",
    internalFile: null,
    label: "Convention de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
  {
    documentType: "PROGRAMME",
    filename: "Programme-formation-{code}.pdf",
    internalFile: null,
    label: "Programme de formation (PDF personnalisé)",
    delivery: "generated_pdf",
  },
  {
    documentType: "AGEFICE_DEMANDE",
    filename: "AGEFICE-Demande-prise-en-charge-2025-2026.pdf",
    internalFile: "agefice-demande-prise-en-charge-2025-2026.pdf",
    label: "Demande préalable de financement AGEFICE (à compléter / signer)",
    delivery: "static_pdf",
  },
  {
    documentType: "AGEFICE_PIECES",
    filename: "AGEFICE-Pieces-justificatives-2026.pdf",
    internalFile: "agefice-pieces-justificatives-2026.pdf",
    label: "Liste des pièces justificatives AGEFICE 2026",
    delivery: "static_pdf",
  },
];

/**
 * Anciens modèles Word (MERGEFIELD) — référence admin uniquement.
 * Ne jamais les joindre au pack ni les exposer comme documents du stagiaire.
 */
export const LEGACY_WORD_REGISTRATION_TEMPLATES: Array<{
  documentType: "CONVENTION" | "PROGRAMME";
  filename: string;
  internalFile: string;
  label: string;
}> = [
  {
    documentType: "CONVENTION",
    filename: "Convention Stage langues Station 2022.dotx",
    internalFile: "convention-stage-langues-station-2022.dotx",
    label: "Ancien modèle Word — Convention (ne plus envoyer)",
  },
  {
    documentType: "PROGRAMME",
    filename: "Contenu pedagogique Station 2022.dotx",
    internalFile: "contenu-pedagogique-station-2022.dotx",
    label: "Ancien modèle Word — Programme (ne plus envoyer)",
  },
];

/** PDF statiques remplaçables depuis /admin (critères + tutoriel + AGEFICE). */
export const REPLACEABLE_REGISTRATION_TEMPLATES = [
  ...REGISTRATION_WELCOME_DOCUMENTS,
  ...AGEFICE_WELCOME_DOCUMENTS,
].filter(
  (d): d is RegistrationWelcomeDocument & { internalFile: string } =>
    d.delivery === "static_pdf" && Boolean(d.internalFile),
);

/** Préfixe storage (bucket `documents`, objets staff) pour les modèles remplaçables. */
export const REGISTRATION_TEMPLATE_STORAGE_PREFIX = "staff/registration-templates";

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REGLEMENT: "Critères de prise en charge",
  CONVENTION: "Convention de formation",
  PROGRAMME: "Programme de formation",
  LIVRET: "Tutoriel FIF-PL",
  AGEFICE_DEMANDE: "Demande AGEFICE",
  AGEFICE_PIECES: "Pièces justificatives AGEFICE",
  AGEFICE_ASSIDUITE: "Attestation d'assiduité AGEFICE",
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
  return (
    REPLACEABLE_REGISTRATION_TEMPLATES.some((d) => d.internalFile === internalFile) ||
    LEGACY_WORD_REGISTRATION_TEMPLATES.some((d) => d.internalFile === internalFile)
  );
}

export function isReplaceableRegistrationTemplate(internalFile: string): boolean {
  return REPLACEABLE_REGISTRATION_TEMPLATES.some((d) => d.internalFile === internalFile);
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

export function expectsAgeficeWelcomePack(params: {
  fundingOrganization?: string | null;
  observations?: string | null;
}): boolean {
  const org = (params.fundingOrganization || "").toLowerCase();
  if (org.includes("agefice")) return true;
  return params.observations?.toLowerCase().includes("agefice") ?? false;
}

/** Pack à afficher / envoyer selon le financement (flux produit). */
export function resolveWelcomePackDocuments(params: {
  fundingOrganization?: string | null;
  observations?: string | null;
  modality?: string | null;
  courseLocation?: string | null;
}): RegistrationWelcomeDocument[] | null {
  const flow = getFundingFlow(params.fundingOrganization);
  if (flow) {
    if (flow.packId === "agefice") return AGEFICE_WELCOME_DOCUMENTS;
    if (flow.packId === "fifpl") return REGISTRATION_WELCOME_DOCUMENTS;
    if (flow.packId === "convention_programme") return SELF_WELCOME_DOCUMENTS;
    return null; // opco / company : pas de pack auto
  }
  if (expectsAgeficeWelcomePack(params)) return AGEFICE_WELCOME_DOCUMENTS;
  if (expectsSkiMonitorWelcomePack(params)) return REGISTRATION_WELCOME_DOCUMENTS;
  return null;
}

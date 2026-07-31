export interface SkiMonitorWelcomeDocument {
  documentType: "REGLEMENT" | "CONVENTION" | "PROGRAMME";
  filename: string;
  internalFile: string;
  label: string;
}

/** Documents envoyés à chaque moniteur de ski inscrit. */
export const SKI_MONITOR_WELCOME_DOCUMENTS: SkiMonitorWelcomeDocument[] = [
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

/** @deprecated use SKI_MONITOR_WELCOME_DOCUMENTS */
export const SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS = SKI_MONITOR_WELCOME_DOCUMENTS;

export interface RegistrationLike {
  profession?: string;
  modality?: string;
  location?: string;
  isCustomFormat?: boolean;
  duration?: string;
}

export function shouldSendSkiMonitorWelcomeDocuments(
  registration: RegistrationLike
): boolean {
  if (registration.profession !== "ski_instructor") return false;
  if (registration.isCustomFormat || registration.duration === "custom") return false;
  return true;
}

/** @deprecated use shouldSendSkiMonitorWelcomeDocuments */
export function shouldSendSkiMonitorOnlineWelcomeDocuments(
  registration: RegistrationLike
): boolean {
  return shouldSendSkiMonitorWelcomeDocuments(registration);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function loadSkiMonitorWelcomeDocument(internalFile: string): Promise<Uint8Array> {
  const fileUrl = new URL(`./registration-documents/${internalFile}`, import.meta.url);
  return await Deno.readFile(fileUrl);
}

export async function buildSkiMonitorWelcomeAttachments(): Promise<
  Array<{ filename: string; content: string }>
> {
  const attachments: Array<{ filename: string; content: string }> = [];

  for (const doc of SKI_MONITOR_WELCOME_DOCUMENTS) {
    const bytes = await loadSkiMonitorWelcomeDocument(doc.internalFile);
    attachments.push({
      filename: doc.filename,
      content: bytesToBase64(bytes),
    });
  }

  return attachments;
}

export function getPublicDocumentUrl(appBaseUrl: string, internalFile: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/registration-documents/${internalFile}`;
}

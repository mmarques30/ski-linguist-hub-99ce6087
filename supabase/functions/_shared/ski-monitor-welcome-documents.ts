export interface SkiMonitorWelcomeDocument {
  documentType: "REGLEMENT" | "CONVENTION" | "PROGRAMME";
  filename: string;
  internalFile: string;
  label: string;
}

export const SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS: SkiMonitorWelcomeDocument[] = [
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

export interface RegistrationLike {
  profession?: string;
  modality?: string;
  location?: string;
  isCustomFormat?: boolean;
  duration?: string;
}

export function shouldSendSkiMonitorOnlineWelcomeDocuments(
  registration: RegistrationLike
): boolean {
  if (registration.profession !== "ski_instructor") return false;
  if (registration.isCustomFormat || registration.duration === "custom") return false;

  return (
    registration.modality === "online_individual" ||
    registration.modality === "online_group" ||
    registration.location === "online"
  );
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

  for (const doc of SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS) {
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

export interface SkiMonitorWelcomeDocument {
  documentType: "REGLEMENT" | "CONVENTION" | "PROGRAMME" | "LIVRET";
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
  {
    documentType: "LIVRET",
    filename: "Tutoriel FIF-PL FLI.pdf",
    internalFile: "tutoriel-fif-pl-fli.pdf",
    label: "Tutoriel pour la demande de prise en charge FIF-PL",
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
  // All ski instructor registrations receive the pack, regardless of modality.
  return true;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function loadSkiMonitorWelcomeDocument(
  internalFile: string,
  // deno-lint-ignore no-explicit-any
  supabase?: any,
): Promise<Uint8Array> {
  if (supabase) {
    try {
      const path = `staff/registration-templates/${internalFile}`;
      const { data, error } = await supabase.storage.from("documents").download(path);
      if (!error && data) {
        return new Uint8Array(await data.arrayBuffer());
      }
    } catch (storageError) {
      console.warn("registration template storage fallback:", storageError);
    }
  }

  const fileUrl = new URL(`./registration-documents/${internalFile}`, import.meta.url);
  return await Deno.readFile(fileUrl);
}

export async function buildSkiMonitorWelcomeAttachments(
  // deno-lint-ignore no-explicit-any
  supabase?: any,
): Promise<
  Array<{ filename: string; content: string }>
> {
  const attachments: Array<{ filename: string; content: string }> = [];

  for (const doc of SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS) {
    const bytes = await loadSkiMonitorWelcomeDocument(doc.internalFile, supabase);
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

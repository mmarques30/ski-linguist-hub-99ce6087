/**
 * Pack d'inscription moniteur — aligné sur src/lib/registration-welcome-documents.ts.
 *
 * Convention et programme partent en PDF personnalisé (send-inscription-documents),
 * jamais en .dotx Word vide. Seuls critères + tutoriel sont des fichiers statiques.
 */

export type SkiMonitorDocumentDelivery = "static_pdf" | "generated_pdf";

export interface SkiMonitorWelcomeDocument {
  documentType: "REGLEMENT" | "CONVENTION" | "PROGRAMME" | "LIVRET";
  filename: string;
  internalFile: string | null;
  label: string;
  delivery: SkiMonitorDocumentDelivery;
}

export const FIFPL_REGLEMENT_SKI_MONITOR: SkiMonitorWelcomeDocument = {
  documentType: "REGLEMENT",
  filename: "Criteres de prise en charge Moniteurs de ski 2026.pdf",
  internalFile: "criteres-prise-en-charge-2026.pdf",
  label: "Critères de prise en charge Moniteurs de ski 2026",
  delivery: "static_pdf",
};

export const FIFPL_REGLEMENT_MOUNTAIN_GUIDE: SkiMonitorWelcomeDocument = {
  documentType: "REGLEMENT",
  filename: "Criteres de prise en charge Guides de montagne 2026.pdf",
  internalFile: "criteres-prise-en-charge-guides-montagne-2026.pdf",
  label: "Critères de prise en charge Guides de montagne 2026",
  delivery: "static_pdf",
};

export const SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS: SkiMonitorWelcomeDocument[] = [
  FIFPL_REGLEMENT_SKI_MONITOR,
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

export function isMountainGuideFifplContext(params: {
  observations?: string | null;
  fundingDetails?: string | null;
}): boolean {
  const obs = (params.observations || "").toLowerCase();
  if (obs.includes("guide de montagne")) return true;
  const details = (params.fundingDetails || "").toLowerCase();
  return (
    details.includes("guide_montagne") ||
    details.includes("guide de montagne") ||
    details.includes("8551zg")
  );
}

export function resolveFifplReglementDocument(params: {
  observations?: string | null;
  fundingDetails?: string | null;
}): SkiMonitorWelcomeDocument & { internalFile: string } {
  const doc = isMountainGuideFifplContext(params)
    ? FIFPL_REGLEMENT_MOUNTAIN_GUIDE
    : FIFPL_REGLEMENT_SKI_MONITOR;
  return doc as SkiMonitorWelcomeDocument & { internalFile: string };
}

/** PDF statiques du pack (critères + tutoriel) — seuls fichiers chargeables depuis le disque. */
export const SKI_MONITOR_STATIC_PACK_DOCUMENTS = SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS.filter(
  (d): d is SkiMonitorWelcomeDocument & { internalFile: string } =>
    d.delivery === "static_pdf" && Boolean(d.internalFile),
);

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
  if (internalFile.toLowerCase().endsWith(".dotx")) {
    throw new Error(
      `Refus de charger un modèle Word (.dotx) pour le pack moniteur : ${internalFile}. ` +
        "Convention et programme doivent être des PDF générés avec les données du stagiaire.",
    );
  }

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

/**
 * Pièces jointes statiques uniquement (critères + tutoriel).
 * Ne joint jamais de Word : convention / programme sont générés ailleurs en PDF.
 */
export async function buildSkiMonitorWelcomeAttachments(
  // deno-lint-ignore no-explicit-any
  supabase?: any,
): Promise<
  Array<{ filename: string; content: string }>
> {
  const attachments: Array<{ filename: string; content: string }> = [];

  for (const doc of SKI_MONITOR_STATIC_PACK_DOCUMENTS) {
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

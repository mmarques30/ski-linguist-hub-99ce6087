/**
 * Assets PDF dossier inscription (cachet + signature organisme).
 * Aligné sur src/lib/inscription-documents-assets.ts.
 *
 * Edge : le PNG est embarqué en base64 (`inscription-documents-signature-b64.ts`)
 * car `Deno.readFile` + `import.meta.url` ne livre pas fiablement les binaires
 * au déploiement Supabase/Lovable (PDF convention ~8 Ko sans image).
 * Fallback fichier local pour les tests Deno hors Edge.
 */
import { ORGANISM_SIGNATURE_PNG_BASE64 } from "./inscription-documents-signature-b64.ts";

export const INSCRIPTION_DOCUMENT_ASSET_FILES = {
  organismSignature: "fli-signature-cachet.png",
} as const;

function decodeBase64Png(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function loadInscriptionOrganismSignature(): Promise<Uint8Array> {
  const embedded = decodeBase64Png(ORGANISM_SIGNATURE_PNG_BASE64);
  if (embedded.length > 0) return embedded;

  return await Deno.readFile(
    new URL(
      `./inscription-documents-assets/${INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature}`,
      import.meta.url,
    ),
  );
}

/**
 * Assets PDF dossier inscription (cachet + signature organisme + en-tête).
 * Aligné sur src/lib/inscription-documents-assets.ts.
 *
 * Edge : les PNG sont embarqués en base64 car `Deno.readFile` + `import.meta.url`
 * ne livrent pas fiablement les binaires au déploiement Supabase/Lovable.
 * Fallback fichier local pour les tests Deno hors Edge.
 */
import { ORGANISM_SIGNATURE_PNG_BASE64 } from "./inscription-documents-signature-b64.ts";
import { LETTERHEAD_PNG_BASE64 } from "./inscription-documents-letterhead-b64.ts";

export const INSCRIPTION_DOCUMENT_ASSET_FILES = {
  organismSignature: "fli-signature-cachet.png",
  letterhead: "fli-entete.png",
} as const;

function decodeBase64Png(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadAssetFile(fileName: string): Promise<Uint8Array> {
  return await Deno.readFile(
    new URL(`./inscription-documents-assets/${fileName}`, import.meta.url),
  );
}

export async function loadInscriptionOrganismSignature(): Promise<Uint8Array> {
  const embedded = decodeBase64Png(ORGANISM_SIGNATURE_PNG_BASE64);
  if (embedded.length > 0) return embedded;
  return await loadAssetFile(INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature);
}

export async function loadInscriptionLetterhead(): Promise<Uint8Array> {
  const embedded = decodeBase64Png(LETTERHEAD_PNG_BASE64);
  if (embedded.length > 0) return embedded;
  return await loadAssetFile(INSCRIPTION_DOCUMENT_ASSET_FILES.letterhead);
}

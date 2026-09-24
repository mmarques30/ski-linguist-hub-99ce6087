/**
 * Assets PDF dossier inscription (cachet + signature organisme).
 * Aligné sur src/lib/inscription-documents-assets.ts.
 * Node : public/inscription-documents — Deno : _shared/inscription-documents-assets.
 */
export const INSCRIPTION_DOCUMENT_ASSET_FILES = {
  organismSignature: "fli-signature-cachet.png",
} as const;

export async function loadInscriptionOrganismSignature(): Promise<Uint8Array> {
  return await Deno.readFile(
    new URL(
      `./inscription-documents-assets/${INSCRIPTION_DOCUMENT_ASSET_FILES.organismSignature}`,
      import.meta.url
    )
  );
}

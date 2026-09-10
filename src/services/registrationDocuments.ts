import { supabase } from "@/integrations/supabase/client";

/**
 * Dépôt d'une pièce jointe du formulaire public d'inscription.
 *
 * Le bucket `documents` est privé : le client anonyme n'a pas le droit d'écrire.
 * Le fichier passe par l'edge function `upload-registration-document`, qui
 * utilise la clé service-role côté serveur et renvoie le **chemin** de stockage.
 * Ne jamais réintroduire d'appel direct à `supabase.storage.upload` ici.
 */
export interface RegistrationDocumentUpload {
  studentId?: string;
  documentKind: string;
  file: File;
}

async function toBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadRegistrationDocument({
  studentId,
  documentKind,
  file,
}: RegistrationDocumentUpload): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ path: string }>(
    "upload-registration-document",
    {
      body: {
        studentId,
        documentKind,
        fileName: file.name,
        contentType: file.type,
        contentBase64: await toBase64(file),
      },
    }
  );

  if (error || !data?.path) {
    throw new Error(error?.message || "Dépôt du document impossible");
  }
  return data.path;
}

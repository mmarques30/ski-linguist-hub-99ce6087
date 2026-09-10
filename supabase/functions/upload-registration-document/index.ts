import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "documents";
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

interface UploadPayload {
  /** Stagiaire propriétaire. Absent avant création du dossier : dépôt sous register/. */
  studentId?: string;
  documentKind: string;
  fileName: string;
  contentType: string;
  /** Contenu encodé en base64, sans préfixe data:. */
  contentBase64: string;
}

function sanitizeSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value.replace(/^data:[^;]+;base64,/, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as UploadPayload;

    const extension = ALLOWED_TYPES[payload.contentType];
    if (!extension) {
      return new Response(
        JSON.stringify({ error: "Type de fichier non autorisé" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.contentBase64 || !payload.documentKind) {
      return new Response(
        JSON.stringify({ error: "Requête incomplète" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.studentId && !isUuid(payload.studentId)) {
      return new Response(
        JSON.stringify({ error: "Identifiant stagiaire invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bytes = decodeBase64(payload.contentBase64);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Fichier vide ou trop volumineux (10 Mo max)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clé service-role : le dépôt ne passe jamais par le client anonyme, dont la
    // RLS du bucket privé refuse l'écriture.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Premier segment = student_id : c'est la clé de la politique de lecture
    // du stagiaire (rls_documents_storage_select_owner).
    const ownerSegment = payload.studentId ?? "register";
    const baseName = sanitizeSegment(
      payload.fileName?.replace(/\.[^.]+$/, "") || payload.documentKind
    );
    const path = `${ownerSegment}/${sanitizeSegment(payload.documentKind)}/${crypto.randomUUID()}-${baseName}.${extension}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: payload.contentType,
      upsert: false,
    });

    if (error) {
      console.error("Registration document upload failed:", error.message);
      return new Response(
        JSON.stringify({ error: "Dépôt impossible" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // On renvoie le chemin de stockage, jamais une URL publique : le bucket est privé.
    return new Response(JSON.stringify({ path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("upload-registration-document error:", error);
    return new Response(JSON.stringify({ error: "Requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

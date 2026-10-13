import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";

const corsHeaders = adminCorsHeaders;

const BUCKET = "documents";
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

interface UploadPayload {
  /** Stagiaire propriétaire. Réservé staff/service_role — le public dépose sous register/. */
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

function serviceRoleClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
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

    const requestedStudentId =
      typeof payload.studentId === "string" && payload.studentId.trim()
        ? payload.studentId.trim()
        : undefined;

    if (requestedStudentId && !isUuid(requestedStudentId)) {
      return new Response(
        JSON.stringify({ error: "Identifiant stagiaire invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Finding #11 : un appelant anonyme ne doit pas pouvoir choisir le dossier
    // d'un autre élève. Le formulaire public dépose uniquement sous register/.
    // Un studentId explicite exige staff ou service_role.
    let ownerSegment = "register";
    let supabase = serviceRoleClient();
    if (requestedStudentId) {
      const auth = await requireServiceRoleOrStaff(req);
      if (auth instanceof Response) return auth;
      ownerSegment = requestedStudentId;
      supabase = auth.adminClient;
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

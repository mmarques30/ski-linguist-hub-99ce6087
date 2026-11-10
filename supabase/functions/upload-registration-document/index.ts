import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";

const corsHeaders = adminCorsHeaders;

const BUCKET = "documents";
const MAX_BYTES = 10 * 1024 * 1024;
/** Limite anti-spam pour les dépôts publics sous register/ (par IP / fenêtre). */
const PUBLIC_UPLOAD_LIMIT = 20;
const PUBLIC_UPLOAD_WINDOW_MS = 60_000;

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

type RateBucket = { count: number; resetAt: number };
const publicUploadBuckets = new Map<string, RateBucket>();

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

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  return "unknown";
}

function allowPublicUpload(ip: string): boolean {
  const now = Date.now();
  const cur = publicUploadBuckets.get(ip);
  if (!cur || now >= cur.resetAt) {
    publicUploadBuckets.set(ip, {
      count: 1,
      resetAt: now + PUBLIC_UPLOAD_WINDOW_MS,
    });
    return true;
  }
  if (cur.count >= PUBLIC_UPLOAD_LIMIT) return false;
  cur.count += 1;
  return true;
}

/** Vérifie les magic bytes — ne pas se fier au seul Content-Type client. */
function matchesDeclaredType(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === "application/pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    ); // %PDF-
  }
  if (contentType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  if (contentType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return false;
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
    let isPublicUpload = true;
    if (requestedStudentId) {
      const auth = await requireServiceRoleOrStaff(req);
      if (auth instanceof Response) return auth;
      ownerSegment = requestedStudentId;
      supabase = auth.adminClient;
      isPublicUpload = false;
    }

    if (isPublicUpload && !allowPublicUpload(clientIp(req))) {
      return new Response(
        JSON.stringify({ error: "Trop de dépôts — réessayez dans une minute" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bytes = decodeBase64(payload.contentBase64);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Fichier vide ou trop volumineux (10 Mo max)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!matchesDeclaredType(bytes, payload.contentType)) {
      return new Response(
        JSON.stringify({ error: "Contenu fichier incohérent avec le type déclaré" }),
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
    console.error(
      "upload-registration-document error:",
      error instanceof Error ? error.message : "invalid"
    );
    return new Response(JSON.stringify({ error: "Requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

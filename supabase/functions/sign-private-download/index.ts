/**
 * Signed URL for private storage objects (documents / certificates / evaluation-pdfs).
 * Auth: staff always; student only for paths under their student_id; formateur for evaluation-pdfs.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_BUCKETS = new Set([
  "documents",
  "certificates",
  "evaluation-pdfs",
]);

const TTL_SECONDS = 60 * 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const bucket = String(body.bucket || "").trim();
    const path = String(body.path || "").trim().replace(/^\/+/, "");

    if (!ALLOWED_BUCKETS.has(bucket) || !path || path.includes("..")) {
      return json({ success: false, error: "bucket/path invalide" }, 400);
    }

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice("Bearer ".length);
    let userId: string | null = null;
    const { data: claimsData } = await caller.auth.getClaims(token);
    if (claimsData?.claims?.sub && typeof claimsData.claims.sub === "string") {
      userId = claimsData.claims.sub;
    } else {
      const { data: userData } = await caller.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }
    if (!userId) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleSet = new Set((roles || []).map((r) => r.role as string));
    const isStaff = roleSet.has("admin") || roleSet.has("user");
    const isFormateur = roleSet.has("formateur");
    const isStudent = roleSet.has("student");

    let allowed = isStaff;
    if (!allowed && bucket === "evaluation-pdfs" && isFormateur) {
      allowed = true;
    }
    if (!allowed && isStudent && (bucket === "documents" || bucket === "certificates")) {
      const { data: student } = await admin
        .from("students")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      const folder = path.split("/")[0];
      allowed = Boolean(student?.id && folder === student.id);
    }

    if (!allowed) {
      return json({ success: false, error: "Forbidden" }, 403);
    }

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return json(
        { success: false, error: error?.message || "objet introuvable" },
        404,
      );
    }

    return json({ success: true, signedUrl: data.signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

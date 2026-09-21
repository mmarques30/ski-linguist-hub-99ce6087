import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKETS = ["certificates", "documents", "funding-documents"] as const;

/** PostgREST / Deno : les erreurs ne sont pas toujours des `Error`. */
function describeCleanupError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (error && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    for (const key of ["message", "error", "details", "hint"] as const) {
      const value = rec[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "Erreur interne de nettoyage (sans détail)";
}

async function listPrefix(
  admin: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const { data, error } = await admin.storage.from(bucket).list(prefix, {
    limit: 1000,
    offset: 0,
  });
  if (error) throw error;
  const paths: string[] = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      paths.push(path);
    } else {
      paths.push(...(await listPrefix(admin, bucket, path)));
    }
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");

    let userId: string | null = null;
    const { data: claimsData } = await callerClient.auth.getClaims(token);
    if (claimsData?.claims?.sub && typeof claimsData.claims.sub === "string") {
      userId = claimsData.claims.sub;
    } else {
      const { data: userData, error: userError } = await callerClient.auth.getUser(token);
      if (!userError && userData?.user?.id) {
        userId = userData.user.id;
      }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RPC en JWT utilisateur : cleanup_zztest_data vérifie is_admin() via
    // auth.uid(). Un client service-role laisse auth.uid() NULL → 42501
    // « Réservé à un compte administrateur », souvent remonté comme « Erreur ».
    const body = (await req.json().catch(() => ({}))) as { dry_run?: boolean };
    const dryRun = body.dry_run !== false;

    if (!dryRun) {
      const { data: students, error: studentsError } = await admin
        .from("students")
        .select("id")
        .or("first_name.ilike.ZZTEST%,last_name.ilike.ZZTEST%")
        .ilike("email", "%@example.invalid");
      if (studentsError) throw studentsError;

      const removed: string[] = [];
      for (const student of students ?? []) {
        for (const bucket of BUCKETS) {
          const paths = await listPrefix(admin, bucket, student.id);
          if (paths.length === 0) continue;
          const { error: removeError } = await admin.storage.from(bucket).remove(paths);
          if (removeError) throw removeError;
          removed.push(...paths.map((p) => `${bucket}/${p}`));
        }
      }

      const { data, error } = await callerClient.rpc("cleanup_zztest_data", {
        _dry_run: false,
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({
          ...(data ?? {}),
          storage_deleted_via_api: removed.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await callerClient.rpc("cleanup_zztest_data", {
      _dry_run: true,
    });
    if (error) throw error;
    return new Response(JSON.stringify(data ?? {}), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = describeCleanupError(error);
    return new Response(JSON.stringify({ error: message, success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

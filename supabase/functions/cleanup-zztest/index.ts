import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKETS = ["certificates", "documents", "funding-documents"] as const;

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
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

      const { data, error } = await admin.rpc("cleanup_zztest_data", {
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

    const { data, error } = await admin.rpc("cleanup_zztest_data", {
      _dry_run: true,
    });
    if (error) throw error;
    return new Response(JSON.stringify(data ?? {}), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const adminCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function requireAdmin(
  req: Request
): Promise<{ adminClient: SupabaseClient; userId: string } | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: isAdmin } = await adminClient.rpc("has_role", {
    _user_id: claimsData.claims.sub,
    _role: "admin",
  });

  if (!isAdmin) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden: admin only" }), {
      status: 403,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }

  return { adminClient, userId: claimsData.claims.sub };
}

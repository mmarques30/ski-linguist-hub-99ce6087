import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const BUCKET = "documents";
const PATH =
  "2c305bc5-d7c3-48c9-a369-87799102c908/cb096d14-65a1-4c08-9696-c86208f205c7/Convention-formation-FLI-260014.pdf";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: roleRow, error: roleError } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (roleError || !roleRow) {
      return json({ success: false, error: roleError?.message ?? "no admin role" }, 404);
    }

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(roleRow.user_id);
    const email = userData?.user?.email;
    if (userError || !email) {
      return json({ success: false, error: userError?.message ?? "no admin email" }, 404);
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return json({ success: false, error: linkError?.message ?? "no token_hash" }, 500);
    }

    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    const accessToken = otpData?.session?.access_token;
    if (otpError || !accessToken) {
      return json({ success: false, error: otpError?.message ?? "no access_token" }, 500);
    }

    const asUser = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: me, error: meError } = await asUser.auth.getUser();
    const getUserEmail = me?.user?.email ?? null;
    if (meError || !me?.user) {
      return json({ success: false, error: meError?.message ?? "getUser failed" }, 401);
    }

    const { data: isAdmin, error: adminCheckError } = await asUser.rpc("is_admin");
    const hasAdminToken = isAdmin === true;
    if (adminCheckError || !hasAdminToken) {
      return json({
        success: false,
        hasAdminToken,
        getUserEmail,
        error: adminCheckError?.message ?? "token is not admin",
      }, 403);
    }

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(PATH, 120);
    if (signError || !signed?.signedUrl) {
      return json({
        success: false,
        hasAdminToken,
        getUserEmail,
        error: signError?.message ?? "no signed url",
      }, 500);
    }

    return json({
      success: true,
      hasAdminToken,
      signedUrl: signed.signedUrl,
      getUserEmail,
    });
  } catch (e) {
    return json({ success: false, error: String(e) }, 500);
  }
});

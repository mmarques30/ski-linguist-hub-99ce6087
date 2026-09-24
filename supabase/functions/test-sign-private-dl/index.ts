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

  let clientOk = false;
  let edgeOk = false;

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (!roleRow) return json({ success: false, clientOk, edgeOk });

    const { data: userData } = await admin.auth.admin.getUserById(roleRow.user_id);
    const email = userData?.user?.email;
    if (!email) return json({ success: false, clientOk, edgeOk });

    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (!tokenHash) return json({ success: false, clientOk, edgeOk });

    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: otpData } = await anon.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    const accessToken = otpData?.session?.access_token;
    if (!accessToken) return json({ success: false, clientOk, edgeOk });

    // 1) Client user direct
    const asUser = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    try {
      const { data, error } = await asUser.storage.from(BUCKET).createSignedUrl(PATH, 120);
      clientOk = !error && !!data?.signedUrl;
    } catch {
      clientOk = false;
    }

    // 2) Edge sign-private-download
    try {
      const res = await fetch(`${url}/functions/v1/sign-private-download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucket: BUCKET, path: PATH }),
      });
      const body = await res.json().catch(() => null);
      edgeOk = !!(body && body.success && body.signedUrl);
    } catch {
      edgeOk = false;
    }

    return json({ success: clientOk || edgeOk, clientOk, edgeOk });
  } catch {
    return json({ success: false, clientOk, edgeOk }, 500);
  }
});

import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await sb.storage
      .from("documents")
      .download(
        "2c305bc5-d7c3-48c9-a369-87799102c908/cb096d14-65a1-4c08-9696-c86208f205c7/Convention-formation-FLI-260014.pdf",
      );
    if (error || !data) throw new Error(error?.message ?? "no data");
    const buf = new Uint8Array(await data.arrayBuffer());
    return new Response(
      JSON.stringify({ success: true, bytes: buf.length, pdfBase64: encodeBase64(buf) }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

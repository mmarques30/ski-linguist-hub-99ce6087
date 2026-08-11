import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-secret",
};

interface MonitorRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  home_station?: string | null;
  status: "active" | "unsubscribed";
  notes?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const importSecret = Deno.env.get("IMPORT_SECRET");
    const provided = req.headers.get("x-import-secret");

    if (!importSecret || provided !== importSecret) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rows = (body.rows || []) as MonitorRow[];

    if (!rows.length) {
      return new Response(JSON.stringify({ success: false, error: "No rows provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const BATCH = 150;
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH).map((r) => ({
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email.trim().toLowerCase(),
        phone: r.phone || null,
        home_station: r.home_station || null,
        status: r.status,
        notes: r.notes || null,
        partner_id: null,
        ski_school_id: null,
      }));

      const { error } = await supabase.from("ski_monitors").upsert(batch, { onConflict: "email" });
      if (error) errors.push(`batch ${i / BATCH + 1}: ${error.message}`);
      else imported += batch.length;
    }

    return new Response(
      JSON.stringify({ success: errors.length === 0, imported, errors, total: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEMPLATE_SLUG = "instructor_notice_manual";

interface AdhocEmail {
  to: string;
  subject: string;
  html: string;
  inscription_id?: string | null;
  recipient_name?: string | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "POST uniquement" }, 405);

  let payload: { emails?: AdhocEmail[] };
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: "JSON invalide" }, 400);
  }

  const emails = Array.isArray(payload?.emails) ? payload.emails : [];
  if (emails.length === 0) return json({ success: false, error: "emails[] requis" }, 400);
  for (const e of emails) {
    if (!e || typeof e.to !== "string" || !e.to.includes("@") ||
        typeof e.subject !== "string" || !e.subject.trim() ||
        typeof e.html !== "string" || !e.html.trim()) {
      return json({ success: false, error: "Chaque email exige to, subject, html" }, 400);
    }
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return json({ success: false, error: "RESEND_API_KEY absente — aucun envoi." }, 409);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<Record<string, unknown>> = [];
  for (const e of emails) {
    const send = await sendFliEmail({
      resendApiKey,
      to: e.to.trim(),
      subject: e.subject,
      html: e.html,
    });
    let emailLogId: string | null = null;
    let logError: string | null = null;
    if (send.ok) {
      const { data, error } = await supabaseAdmin
        .from("email_log")
        .insert({
          template_slug: TEMPLATE_SLUG,
          status: "sent",
          recipient_email: e.to.trim(),
          recipient_name: e.recipient_name ?? null,
          inscription_id: e.inscription_id ?? null,
          sent_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) logError = error.message;
      else emailLogId = data?.id ?? null;
    }
    results.push({
      to: e.to,
      ok: send.ok,
      skipped: send.skipped,
      status: send.status ?? null,
      error: send.error ?? null,
      email_log_id: emailLogId,
      log_error: logError,
    });
  }

  return json({ success: results.every((r) => r.ok), results });
});

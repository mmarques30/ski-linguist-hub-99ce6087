/**
 * One-shot manuel — envoi facture + attestation FIFPL (Julien Mathé, Tom Boniface).
 * Utilise RESEND_API_KEY (secret Edge). Corps + PJ fournis dans le POST.
 */
import { sendFliEmail } from "../_shared/fli-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED = new Set(["julien.mathe@live.fr", "tom.bo2004@sfr.fr"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY absente — aucun envoi.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const emails = Array.isArray(body?.emails) ? body.emails : [];
    if (!emails.length) {
      return new Response(
        JSON.stringify({ success: false, error: "emails[] requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const results: Array<Record<string, unknown>> = [];

    for (const email of emails) {
      const to = String(email.to || "").trim().toLowerCase();
      if (!ALLOWED.has(to)) {
        results.push({ to, ok: false, error: "destinataire non autorisé" });
        continue;
      }
      const attachments = Array.isArray(email.attachments)
        ? email.attachments.map(
          (a: { filename: string; content: string }) => ({
            filename: a.filename,
            content: a.content,
          }),
        )
        : [];

      const outcome = await sendFliEmail({
        resendApiKey,
        to,
        subject: String(email.subject || ""),
        html: String(email.html || ""),
        attachments,
      });
      results.push({ to, ...outcome });
    }

    const allOk = results.every((r) => r.ok === true);
    return new Response(
      JSON.stringify({ success: allOk, results }),
      {
        status: allOk ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

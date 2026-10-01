import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFliEmail } from "../_shared/fli-email.ts";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "../_shared/inscription-documents-pdf-model.ts";
import { renderInscriptionDocumentPdf } from "../_shared/inscription-documents-pdf-render.ts";
import {
  loadInscriptionLetterhead,
  loadInscriptionOrganismSignature,
} from "../_shared/inscription-documents-assets.ts";
import { ORGANIZATION_IDENTITY_KEY } from "../_shared/organization-identity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const TEMPLATE_SLUG = "inscription_documents_payment_manual";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "POST requis" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const inscriptionId = typeof body?.inscription_id === "string" ? body.inscription_id : "";
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject : "";
    const html = typeof body?.html === "string" ? body.html : "";
    const recipientName = typeof body?.recipient_name === "string" ? body.recipient_name : null;
    if (!inscriptionId || !to || !subject || !html) {
      return json({ success: false, error: "inscription_id, to, subject, html requis" }, 400);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return json({ success: false, error: "RESEND_API_KEY absente" }, 409);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: inscription, error: insError } = await supabase
      .from("inscriptions")
      .select(
        `
        id, code, language, start_date, end_date, duration_hours, course_location,
        modality, price, deposit_amount, balance_after_deposit, group_size,
        funding_organization, documents_sent_at,
        students!inscriptions_student_id_fkey (
          civility, first_name, last_name, street_address, postal_code, city,
          email, phone, company
        )
      `
      )
      .eq("id", inscriptionId)
      .maybeSingle();
    if (insError) throw insError;
    if (!inscription) return json({ success: false, error: "inscription introuvable" }, 404);

    const { data: identityRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ORGANIZATION_IDENTITY_KEY)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    const student = ((inscription as any).students || {}) as any;
    const conventionModel = buildConventionPdfModel({ inscription, student, identity: identityRow?.value });
    const programmeModel = buildProgrammePdfModel({ inscription, student, identity: identityRow?.value });

    const [organismSignaturePng, letterheadPng] = await Promise.all([
      loadInscriptionOrganismSignature(),
      loadInscriptionLetterhead(),
    ]);
    if (!organismSignaturePng?.length) throw new Error("signature organisme introuvable");

    const [conventionBytes, programmeBytes] = await Promise.all([
      renderInscriptionDocumentPdf(conventionModel, { organismSignaturePng, letterheadPng }),
      renderInscriptionDocumentPdf(programmeModel, { letterheadPng }),
    ]);
    if (conventionBytes.byteLength < 20_000) {
      throw new Error(`convention trop petite (${conventionBytes.byteLength} o)`);
    }

    const code = inscription.code || "sans-code";
    const attachments = [
      { filename: conventionFilename(code), content: bytesToBase64(conventionBytes) },
      { filename: programmeFilename(code), content: bytesToBase64(programmeBytes) },
    ];

    const result = await sendFliEmail({ resendApiKey, to, subject, html, attachments });
    if (!result.ok) {
      return json({ success: false, error: result.error ?? "envoi Resend échoué" }, 502);
    }

    const { data: logRow } = await supabase
      .from("email_log")
      .insert({
        template_slug: TEMPLATE_SLUG,
        recipient_email: to,
        recipient_name: recipientName,
        status: "sent",
        inscription_id: inscriptionId,
        sent_at: new Date().toISOString(),
        variables_used: { subject, attachments: attachments.map((a) => a.filename) },
      })
      .select("id")
      .maybeSingle();

    await supabase.from("document_sendings").insert([
      { inscription_id: inscriptionId, document_type: "CONVENTION", sent_to: to, pdf_url: null },
      { inscription_id: inscriptionId, document_type: "PROGRAMME", sent_to: to, pdf_url: null },
    ]);

    await supabase
      .from("inscriptions")
      .update({ documents_sent_at: new Date().toISOString() })
      .eq("id", inscriptionId);

    return json({
      success: true,
      email_log_id: logRow?.id ?? null,
      attachments: [
        { filename: attachments[0].filename, bytes: conventionBytes.byteLength },
        { filename: attachments[1].filename, bytes: programmeBytes.byteLength },
      ],
      price: inscription.price,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, 500);
  }
});

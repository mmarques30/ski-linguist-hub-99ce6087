/**
 * One-shot : publie le dossier FIF-PL de Cassandre (FLI-260014) dans
 * document_sendings + storage, envoie l'e-mail inscription_documents, marque
 * le rappel DOCUMENT comme SENT.
 *
 * Body optionnel : { "inscriptionId": "…" } — défaut = Cassandre.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadEmailTemplate, renderEmailTemplate } from "../_shared/email-model-templates.ts";
import { sendFliEmail } from "../_shared/fli-email.ts";
import {
  buildConventionPdfModel,
  buildProgrammePdfModel,
  conventionFilename,
  programmeFilename,
} from "../_shared/inscription-documents-pdf-model.ts";
import { renderInscriptionDocumentPdf } from "../_shared/inscription-documents-pdf-render.ts";
import {
  loadSkiMonitorWelcomeDocument,
  SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS,
} from "../_shared/ski-monitor-welcome-documents.ts";
import { ORGANIZATION_IDENTITY_KEY } from "../_shared/organization-identity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_INSCRIPTION_ID = "cb096d14-65a1-4c08-9696-c86208f205c7";
const TEMPLATE_SLUG = "inscription_documents";
const CRITERIA_DOC = SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS.find(
  (d) => d.documentType === "REGLEMENT",
)!;
const TUTORIEL_DOC = SKI_MONITOR_ONLINE_WELCOME_DOCUMENTS.find(
  (d) => d.documentType === "LIVRET",
)!;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const inscriptionId = String(body.inscriptionId || DEFAULT_INSCRIPTION_ID);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY absente" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const template = await loadEmailTemplate(supabase, TEMPLATE_SLUG);
    if (!template) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Modèle inscription_documents inactif",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: inscription, error: insError } = await supabase
      .from("inscriptions")
      .select(
        `
        id, code, language, start_date, end_date, duration_hours,
        course_location, modality, price, deposit_amount, balance_after_deposit,
        group_size, funding_organization, documents_sent_at,
        students!inscriptions_student_id_fkey (
          civility, first_name, last_name, street_address, postal_code, city,
          email, phone, company
        )
      `,
      )
      .eq("id", inscriptionId)
      .maybeSingle();

    if (insError) throw insError;
    if (!inscription) {
      return new Response(
        JSON.stringify({ success: false, error: "inscription introuvable" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const student =
      (inscription as { students?: Record<string, unknown> }).students || {};
    const email = typeof student.email === "string" ? student.email.trim() : "";
    const studentName = [student.first_name, student.last_name]
      .filter((p) => typeof p === "string" && String(p).trim())
      .join(" ")
      .trim();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "email stagiaire manquant" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: identityRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ORGANIZATION_IDENTITY_KEY)
      .maybeSingle();

    const conventionModel = buildConventionPdfModel({
      inscription,
      student: student as never,
      identity: identityRow?.value,
    });
    const programmeModel = buildProgrammePdfModel({
      inscription,
      student: student as never,
      identity: identityRow?.value,
    });

    const [conventionBytes, programmeBytes, criteriaBytes, tutorielBytes] =
      await Promise.all([
        renderInscriptionDocumentPdf(conventionModel),
        renderInscriptionDocumentPdf(programmeModel),
        loadSkiMonitorWelcomeDocument(CRITERIA_DOC.internalFile, supabase),
        loadSkiMonitorWelcomeDocument(TUTORIEL_DOC.internalFile, supabase),
      ]);

    const code = inscription.code || "sans-code";
    const basePath = `inscriptions/${inscriptionId}`;
    const files = [
      {
        type: "CONVENTION",
        filename: conventionFilename(code),
        path: `${basePath}/${conventionFilename(code)}`,
        bytes: conventionBytes,
      },
      {
        type: "PROGRAMME",
        filename: programmeFilename(code),
        path: `${basePath}/${programmeFilename(code)}`,
        bytes: programmeBytes,
      },
      {
        type: "REGLEMENT",
        filename: CRITERIA_DOC.filename,
        path: `${basePath}/${CRITERIA_DOC.filename.replace(/\s+/g, "-")}`,
        bytes: criteriaBytes,
      },
      {
        type: "LIVRET",
        filename: TUTORIEL_DOC.filename,
        path: `${basePath}/${TUTORIEL_DOC.filename.replace(/\s+/g, "-")}`,
        bytes: tutorielBytes,
      },
    ];

    for (const file of files) {
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(file.path, file.bytes, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (upErr) throw upErr;
    }

    // Remplace d'éventuelles lignes sans PDF
    await supabase
      .from("document_sendings")
      .delete()
      .eq("inscription_id", inscriptionId)
      .in("document_type", ["CONVENTION", "PROGRAMME", "REGLEMENT", "LIVRET"]);

    const nowIso = new Date().toISOString();
    const { error: insDocErr } = await supabase.from("document_sendings").insert(
      files.map((f) => ({
        inscription_id: inscriptionId,
        document_type: f.type,
        sent_to: email,
        sent_at: nowIso,
        pdf_url: f.path,
      })),
    );
    if (insDocErr) throw insDocErr;

    const variables = {
      student_name: studentName || "stagiaire",
      language: inscription.language || "formation",
      inscription_code: code,
    };
    const rendered = renderEmailTemplate(template, variables);
    const attachments = files.map((f) => ({
      filename: f.filename,
      content: bytesToBase64(f.bytes),
    }));

    const sent = (
      await sendFliEmail({
        resendApiKey,
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        attachments,
      })
    ).ok;

    await supabase.from("email_log").insert({
      template_slug: TEMPLATE_SLUG,
      recipient_email: email,
      recipient_name: studentName || null,
      status: sent ? "sent" : "failed",
      inscription_id: inscriptionId,
      variables_used: {
        ...variables,
        attachments: attachments.map((a) => a.filename),
        channel: "manual_publish_portail",
      },
      error_message: sent ? null : "envoi Resend échoué",
    });

    await supabase
      .from("inscriptions")
      .update({ documents_sent_at: nowIso })
      .eq("id", inscriptionId);

    await supabase
      .from("scheduled_reminders")
      .update({ status: "SENT", sent_at: nowIso })
      .eq("related_id", inscriptionId)
      .eq("type", "DOCUMENT")
      .eq("status", "PENDING");

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        email,
        documents: files.map((f) => ({ type: f.type, path: f.path })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

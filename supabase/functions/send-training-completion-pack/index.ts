/**
 * Pack fin de formation — envoi manuel (crons fermés).
 *
 * POST JSON `{ "inscriptionId": "uuid" }`
 * Staff ou service_role. Pièces jointes : certificat, attestation FIF-PL,
 * facture acquittée (déjà générés / stockés). Modèle
 * `training_completion_pack_student`. BCC info@fli.fr via sendFliEmail.
 */

import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from "../_shared/admin-auth.ts";
import {
  loadEmailTemplate,
  renderEmailTemplate,
} from "../_shared/email-model-templates.ts";
import { sendFliEmail } from "../_shared/fli-email.ts";
import { isFliPlaceholderEmail } from "../_shared/email-guards.ts";

const corsHeaders = adminCorsHeaders;
const APP_URL = Deno.env.get("APP_URL") || "https://plateforme.fli.fr";
const CERTIFICATE_BUCKET = "certificates";
const DOCUMENTS_BUCKET = "documents";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatFr(iso: string | null | undefined): string {
  if (!iso) return "";
  const raw = String(iso).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return raw;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireServiceRoleOrStaff(req);
  if (auth instanceof Response) return auth;

  try {
    const payload = (await req.json().catch(() => ({}))) as {
      inscriptionId?: string;
    };
    const inscriptionId = (payload.inscriptionId || "").trim();
    if (!inscriptionId) {
      return json(400, { success: false, error: "inscriptionId requis" });
    }

    const { adminClient } = auth;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const { data: row, error: rowErr } = await adminClient
      .from("inscriptions_complete")
      .select(
        "id, student_id, student_name, student_email, language, end_date, code"
      )
      .eq("id", inscriptionId)
      .maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) {
      return json(404, { success: false, error: "Inscription introuvable" });
    }

    const { data: student } = await adminClient
      .from("students")
      .select("email, first_name, last_name")
      .eq("id", row.student_id)
      .maybeSingle();

    const email = (student?.email || row.student_email || "").trim();
    if (!email || isFliPlaceholderEmail(email)) {
      return json(400, {
        success: false,
        error: `E-mail stagiaire invalide : ${email || "(vide)"}`,
      });
    }
    const studentName =
      [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() ||
      row.student_name ||
      "Stagiaire";

    const { data: survey } = await adminClient
      .from("satisfaction_surveys")
      .select("token")
      .eq("inscription_id", inscriptionId)
      .maybeSingle();
    if (!survey?.token) {
      return json(400, {
        success: false,
        error: "Questionnaire de satisfaction manquant — générez d'abord le pack.",
      });
    }

    const { data: cert } = await adminClient
      .from("certificates")
      .select("id, pdf_url")
      .eq("inscription_id", inscriptionId)
      .maybeSingle();
    if (!cert?.pdf_url) {
      return json(400, {
        success: false,
        error: "Certificat PDF manquant — générez d'abord le pack.",
      });
    }

    const { data: attRows } = await adminClient
      .from("document_sendings")
      .select("pdf_url")
      .eq("inscription_id", inscriptionId)
      .eq("document_type", "ATTESTATION_PRESENCE")
      .limit(1);
    const attestationPath = attRows?.[0]?.pdf_url;
    if (!attestationPath) {
      return json(400, {
        success: false,
        error: "Attestation PDF manquante — générez d'abord le pack.",
      });
    }

    const { data: inv } = await adminClient
      .from("invoices")
      .select("id, invoice_number, status")
      .eq("inscription_id", inscriptionId)
      .in("payment_type", ["integral", "saldo", "solde"])
      .maybeSingle();

    const { data: invSendings } = await adminClient
      .from("document_sendings")
      .select("pdf_url")
      .eq("inscription_id", inscriptionId)
      .eq("document_type", "FACTURE")
      .limit(1);
    const invoicePath = invSendings?.[0]?.pdf_url;
    if (!invoicePath) {
      return json(400, {
        success: false,
        error: "Facture PDF manquante — générez d'abord le pack.",
      });
    }

    const template = await loadEmailTemplate(
      adminClient,
      "training_completion_pack_student"
    );
    if (!template) {
      return json(400, {
        success: false,
        error:
          "Modèle training_completion_pack_student inactif ou absent — valider sur /admin/emails.",
      });
    }

    const invoiceNumber = inv?.invoice_number || "facture";
    const variables = {
      student_name: studentName,
      language: row.language || "formation",
      inscription_code: (row.code || "").trim() || "dossier FIF-PL",
      end_date: formatFr(row.end_date),
      invoice_number: invoiceNumber,
      survey_link: `${APP_URL.replace(/\/$/, "")}/survey/${survey.token}`,
    };
    const rendered = renderEmailTemplate(template, variables);

    const download = async (bucket: string, path: string) => {
      const { data, error } = await adminClient.storage.from(bucket).download(path);
      if (error || !data) {
        throw new Error(`Téléchargement ${bucket}/${path} : ${error?.message || "vide"}`);
      }
      return new Uint8Array(await data.arrayBuffer());
    };

    const certBytes = await download(CERTIFICATE_BUCKET, cert.pdf_url);
    const attBytes = await download(DOCUMENTS_BUCKET, attestationPath);
    const invBytes = await download(DOCUMENTS_BUCKET, invoicePath);

    const safeName = studentName.replace(/[^\w.-]+/g, "-");
    const attachments = [
      {
        filename: `Certificat-fin-formation-${safeName}.pdf`,
        content: bytesToBase64(certBytes),
      },
      {
        filename: `Attestation-presence-FIFPL-${safeName}.pdf`,
        content: bytesToBase64(attBytes),
      },
      {
        filename: `Facture-acquittee-${invoiceNumber}.pdf`,
        content: bytesToBase64(invBytes),
      },
    ];

    const send = await sendFliEmail({
      resendApiKey,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      attachments,
    });

    await adminClient.from("email_log").insert({
      template_slug: "training_completion_pack_student",
      recipient_email: email,
      recipient_name: studentName,
      status: send.ok ? "sent" : send.skipped ? "skipped" : "failed",
      error_message: send.ok ? null : (send.error || "").slice(0, 500),
      inscription_id: inscriptionId,
      variables_used: {
        ...variables,
        attachments: attachments.map((a) => a.filename),
        manual_send: true,
      },
    });

    if (!send.ok) {
      return json(send.skipped ? 400 : 502, {
        success: false,
        error: send.error || "Échec Resend",
        skipped: send.skipped,
      });
    }

    await adminClient
      .from("inscriptions")
      .update({ end_pack_sent_at: new Date().toISOString() })
      .eq("id", inscriptionId);

    return json(200, {
      success: true,
      sent: true,
      to: email,
      subject: rendered.subject,
      attachments: attachments.map((a) => a.filename),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-training-completion-pack:", message);
    return json(500, { success: false, error: message });
  }
});

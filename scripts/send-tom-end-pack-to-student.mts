/**
 * Envoi final pack fin Tom Boniface → tom.bo2004@sfr.fr
 * CC : Anne Boniface <ab732@icloud.com>
 * BCC : info@fli.fr (sendFliEmail)
 *
 * À n'exécuter qu'après OK explicite de Paula.
 *
 *   ./node_modules/.bin/tsx scripts/send-tom-end-pack-to-student.mts
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";
import { DOCUMENTS_BUCKET } from "../src/lib/certificateStorage.ts";
import { buildSurveyUrl } from "../src/lib/client-links.ts";
import { stripCertificateMentionsFromCompletionEmail } from "../src/lib/training-completion-email.ts";
import { pickEndPackInvoice } from "../src/lib/end-pack.ts";
import {
  defaultEndPackCcForInscription,
} from "../src/lib/end-pack-email-cc.ts";
import { isFliPlaceholderEmail } from "../src/lib/email-guards.ts";

const TOM_INSCRIPTION_ID = "5f3452cf-de23-4a3c-a1b7-62b5c6b6198a";
const APP_URL = "https://plateforme.fli.fr";
const FLI_FROM = "FLI — France Langues International <noreply@fli.fr>";
const FLI_REPLY_TO = "info@fli.fr";
const FLI_NOTIFY_BCC = "info@fli.fr";

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function applyTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value ?? "");
  }
  const leftover = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftover?.length) {
    throw new Error(
      `Variables manquantes : ${[...new Set(leftover)].join(", ")}`
    );
  }
  return rendered;
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !anon) throw new Error("missing supabase env");
  if (!resendKey) throw new Error("missing RESEND_API_KEY");

  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword(
    ZZTEST_ADMIN_LOGIN
  );
  if (authError) throw authError;

  const { data: row, error: rowErr } = await supabase
    .from("inscriptions_complete")
    .select(
      "id, student_id, student_name, student_email, language, end_date, code"
    )
    .eq("id", TOM_INSCRIPTION_ID)
    .single();
  if (rowErr) throw rowErr;

  const { data: student } = await supabase
    .from("students")
    .select("email, first_name, last_name")
    .eq("id", row.student_id!)
    .single();

  const email = (student?.email || row.student_email || "").trim();
  if (!email || isFliPlaceholderEmail(email)) {
    throw new Error(`E-mail stagiaire invalide : ${email || "(vide)"}`);
  }
  const studentName =
    [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() ||
    row.student_name ||
    "Tom Boniface";

  const cc = defaultEndPackCcForInscription(TOM_INSCRIPTION_ID);

  const { data: survey } = await supabase
    .from("satisfaction_surveys")
    .select("token")
    .eq("inscription_id", TOM_INSCRIPTION_ID)
    .maybeSingle();
  if (!survey?.token) throw new Error("Questionnaire satisfaction introuvable");

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, amount_ht")
    .eq("inscription_id", TOM_INSCRIPTION_ID)
    .in("payment_type", ["integral", "saldo", "solde"]);
  const inv = pickEndPackInvoice(invoices || []);
  if (!inv?.invoice_number) throw new Error("Facture utilisable introuvable");

  const { data: attRows } = await supabase
    .from("document_sendings")
    .select("pdf_url")
    .eq("inscription_id", TOM_INSCRIPTION_ID)
    .eq("document_type", "ATTESTATION_PRESENCE");
  const attestationPath = attRows?.[0]?.pdf_url;
  if (!attestationPath) throw new Error("Attestation PDF introuvable");

  const { data: invSendings } = await supabase
    .from("document_sendings")
    .select("pdf_url")
    .eq("inscription_id", TOM_INSCRIPTION_ID)
    .eq("document_type", "FACTURE");
  const invoicePath = invSendings?.[0]?.pdf_url;
  if (!invoicePath) throw new Error("Facture PDF introuvable");

  const { data: attBlob, error: attErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(attestationPath);
  if (attErr) throw attErr;
  const { data: invBlob, error: invDlErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(invoicePath);
  if (invDlErr) throw invDlErr;

  const variables = {
    student_name: studentName,
    language: row.language || "Anglais",
    inscription_code: (row.code || "").trim() || "dossier FIF-PL",
    end_date: formatFr(row.end_date!),
    invoice_number: inv.invoice_number!,
    survey_link: buildSurveyUrl(APP_URL, survey.token),
  };

  const { data: tpl } = await supabase
    .from("email_templates")
    .select("subject_fr, body_fr")
    .eq("slug", "training_completion_pack_student")
    .maybeSingle();
  if (!tpl?.subject_fr || !tpl?.body_fr) {
    throw new Error("Modèle training_completion_pack_student introuvable");
  }

  const rendered = stripCertificateMentionsFromCompletionEmail({
    subject: applyTemplate(tpl.subject_fr, variables),
    html: applyTemplate(tpl.body_fr, variables),
  });

  const safeName = studentName.replace(/[^\w.-]+/g, "-");
  const attachments = [
    {
      filename: `Attestation-presence-FIFPL-${safeName}.pdf`,
      content: bytesToBase64(new Uint8Array(await attBlob.arrayBuffer())),
    },
    {
      filename: `Facture-acquittee-${inv.invoice_number}.pdf`,
      content: bytesToBase64(new Uint8Array(await invBlob.arrayBuffer())),
    },
  ];

  const draft = {
    to: email,
    cc,
    bcc: FLI_NOTIFY_BCC,
    subject: rendered.subject,
    attachments: attachments.map((a) => a.filename),
    certificate: false,
  };
  writeFileSync(
    "/opt/cursor/artifacts/tom-end-pack-student-draft.json",
    JSON.stringify(draft, null, 2)
  );
  console.log(JSON.stringify(draft, null, 2));

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FLI_FROM,
      to: [email],
      cc,
      reply_to: [FLI_REPLY_TO],
      bcc: [FLI_NOTIFY_BCC],
      subject: rendered.subject,
      html: rendered.html,
      attachments,
    }),
  });
  const responseText = await response.text();
  let resendId: string | null = null;
  try {
    resendId = JSON.parse(responseText)?.id ?? null;
  } catch {
    /* raw */
  }

  await supabase.from("email_log").insert({
    template_slug: "training_completion_pack_student",
    recipient_email: email,
    recipient_name: studentName,
    status: response.ok ? "sent" : "failed",
    error_message: response.ok ? null : responseText.slice(0, 500),
    inscription_id: TOM_INSCRIPTION_ID,
    variables_used: {
      ...variables,
      attachments: attachments.map((a) => a.filename),
      resend_id: resendId,
      manual_send: true,
      certificate_included: false,
      cc,
    },
  } as never);

  if (response.ok) {
    await supabase
      .from("inscriptions")
      .update({ end_pack_sent_at: new Date().toISOString() } as never)
      .eq("id", TOM_INSCRIPTION_ID);
  }

  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${responseText}`);
  }

  const result = { ok: true, resendId, ...draft };
  writeFileSync(
    "/opt/cursor/artifacts/tom-end-pack-student-sent.json",
    JSON.stringify(result, null, 2)
  );
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

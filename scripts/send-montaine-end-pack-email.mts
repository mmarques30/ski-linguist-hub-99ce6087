/**
 * Envoie le pack fin Montaine (modèle training_completion_pack_student)
 * avec PJ : certificat, attestation FIF-PL, facture acquittée.
 *
 *   DRY_RUN=1 ./node_modules/.bin/tsx scripts/send-montaine-end-pack-email.mts
 *   ./node_modules/.bin/tsx scripts/send-montaine-end-pack-email.mts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ZZTEST_ADMIN_LOGIN } from "../src/lib/zztest-roles-logins.ts";
import { MONTAINE_INSCRIPTION_ID } from "../src/lib/formateur-formation-forms.ts";
import {
  CERTIFICATE_BUCKET,
  DOCUMENTS_BUCKET,
} from "../src/lib/certificateStorage.ts";
import { buildSurveyUrl } from "../src/lib/client-links.ts";
import { isFliPlaceholderEmail } from "../src/lib/email-guards.ts";

const APP_URL = "https://plateforme.fli.fr";
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const FLI_FROM = "FLI — France Langues International <noreply@fli.fr>";
const FLI_REPLY_TO = "info@fli.fr";
const FLI_NOTIFY_BCC = "info@fli.fr";

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value ?? "");
  }
  const leftover = rendered.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftover?.length) {
    throw new Error(`Variables manquantes : ${[...new Set(leftover)].join(", ")}`);
  }
  return rendered;
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

async function buildPaidInvoicePdf(input: {
  invoiceNumber: string;
  invoiceDate: string;
  studentName: string;
  street: string;
  postalCode: string;
  city: string;
  language: string;
  startDate: string;
  endDate: string;
  hours: number;
  amount: number;
  deposit: number;
  depositDate: string;
  paymentDate: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const yellow = rgb(252 / 255, 175 / 255, 23 / 255);
  const ink = rgb(0.12, 0.12, 0.12);
  const muted = rgb(0.35, 0.35, 0.35);
  const green = rgb(0.1, 0.45, 0.2);
  let y = 800;
  const left = 48;

  const line = (text: string, opts?: { bold?: boolean; size?: number; color?: typeof ink }) => {
    const size = opts?.size ?? 10;
    const f = opts?.bold ? fontBold : font;
    page.drawText(text, { x: left, y, size, font: f, color: opts?.color ?? ink });
    y -= size + 4;
  };

  line("France Langues International", { bold: true, size: 12 });
  line("25 avenue de la gare", { size: 9, color: muted });
  line("73800 Montmélian", { size: 9, color: muted });
  line("Tél. 04 79 28 21 09 · info@fli.fr", { size: 9, color: muted });
  line("SIRET 484 772 041 00048", { size: 9, color: muted });
  line("Organisme de formation n° 82 73 01 366 73", { size: 9, color: muted });
  y -= 4;
  page.drawRectangle({ x: left, y: y + 2, width: 500, height: 2.5, color: yellow });
  y -= 18;

  page.drawText("FACTURE", {
    x: 400,
    y: y + 40,
    size: 18,
    font: fontBold,
    color: yellow,
  });
  page.drawText(`N° ${input.invoiceNumber}`, {
    x: 400,
    y: y + 22,
    size: 10,
    font: fontBold,
    color: ink,
  });
  page.drawText(`Date : ${formatFr(input.invoiceDate)}`, {
    x: 400,
    y: y + 8,
    size: 9,
    font,
    color: muted,
  });

  line("Client", { bold: true, size: 9, color: muted });
  line(input.studentName, { bold: true, size: 11 });
  if (input.street) line(input.street, { size: 9 });
  line(`${input.postalCode} ${input.city}`.trim(), { size: 9 });
  y -= 8;

  line(`Formation ${input.language}`, { bold: true });
  line(
    `Du ${formatFr(input.startDate)} au ${formatFr(input.endDate)} — ${input.hours} heures — En ligne`,
    { size: 9, color: muted }
  );
  y -= 6;

  line(`Total HT / TTC (TVA non applicable) : ${input.amount.toFixed(2)} €`, {
    bold: true,
    size: 11,
  });
  line(
    `Acompte reçu le ${formatFr(input.depositDate)} : - ${input.deposit.toFixed(2)} €`,
    { size: 9, color: green }
  );
  line(
    `Solde réglé le ${formatFr(input.paymentDate)} : - ${(input.amount - input.deposit).toFixed(2)} €`,
    { size: 9, color: green }
  );
  line("Net à payer : 0,00 €", { bold: true, size: 12, color: green });
  y -= 10;
  line("FACTURE ACQUITTÉE", { bold: true, size: 14, color: green });
  y -= 8;
  line(
    "Règlement : 150 € Stripe (31/08/2026) + 50 € et 700 € virements (02/09/2026).",
    { size: 8, color: muted }
  );

  y = 70;
  page.drawLine({
    start: { x: left, y: y + 20 },
    end: { x: 545, y: y + 20 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  for (const t of [
    "France Langues International - organisme de formation",
    "SARL au capital de 5000 euros — 25 avenue de la gare, 73800 Montmélian",
    "Siret : 484 772 041 00048 - RCS Chambéry - NAF : 8559A — Organisme n° 82 73 01 366 73",
  ]) {
    page.drawText(t, {
      x: left,
      y,
      size: 7,
      font,
      color: muted,
    });
    y -= 10;
  }

  return doc.save();
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !anon) throw new Error("missing supabase env");
  if (!DRY_RUN && !resendKey) throw new Error("missing RESEND_API_KEY");

  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: ZZTEST_ADMIN_LOGIN.email,
    password: ZZTEST_ADMIN_LOGIN.password,
  });
  if (authError) throw authError;

  const { data: row, error: rowErr } = await supabase
    .from("inscriptions_complete")
    .select(
      "id, student_id, student_name, student_email, student_phone, student_city, language, start_date, end_date, duration_hours, code, price, deposit_amount, deposit_date"
    )
    .eq("id", MONTAINE_INSCRIPTION_ID)
    .single();
  if (rowErr) throw rowErr;

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("email, first_name, last_name, phone, street_address, postal_code, city")
    .eq("id", row.student_id!)
    .single();
  if (studentErr) throw studentErr;

  const email = (student.email || row.student_email || "").trim();
  if (!email || isFliPlaceholderEmail(email)) {
    throw new Error(`Email stagiaire invalide : ${email || "(vide)"}`);
  }
  const studentName =
    [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
    row.student_name ||
    "Montaine Gros-Deleglise";
  const street = student.street_address || "";
  const postalCode = student.postal_code || "";
  const city = student.city || row.student_city || "";

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .select("id, invoice_number, amount_ht, invoice_date, payment_date, status")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID)
    .single();
  if (invErr) throw invErr;

  const { data: survey, error: surveyErr } = await supabase
    .from("satisfaction_surveys")
    .select("token")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID)
    .maybeSingle();
  if (surveyErr) throw surveyErr;
  if (!survey?.token) throw new Error("Questionnaire satisfaction introuvable");

  const { data: cert, error: certErr } = await supabase
    .from("certificates")
    .select("id, pdf_url")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID)
    .maybeSingle();
  if (certErr) throw certErr;
  if (!cert?.pdf_url) throw new Error("Certificat PDF introuvable");

  const { data: attRows, error: attErr } = await supabase
    .from("document_sendings")
    .select("pdf_url")
    .eq("inscription_id", MONTAINE_INSCRIPTION_ID)
    .eq("document_type", "ATTESTATION_PRESENCE");
  if (attErr) throw attErr;
  const attestationPath = attRows?.[0]?.pdf_url;
  if (!attestationPath) throw new Error("Attestation PDF introuvable");

  const { data: certBlob, error: certDlErr } = await supabase.storage
    .from(CERTIFICATE_BUCKET)
    .download(cert.pdf_url);
  if (certDlErr) throw certDlErr;

  const { data: attBlob, error: attDlErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(attestationPath);
  if (attDlErr) throw attDlErr;

  const invoicePdf = await buildPaidInvoicePdf({
    invoiceNumber: inv.invoice_number!,
    invoiceDate: inv.invoice_date!,
    studentName,
    street: street || "5 Chemin de la Roselière",
    postalCode: postalCode || "73100",
    city: city || "Aix-les-Bains",
    language: row.language || "Anglais",
    startDate: row.start_date!,
    endDate: row.end_date!,
    hours: row.duration_hours || 18,
    amount: Number(inv.amount_ht || row.price || 900),
    deposit: Number(row.deposit_amount || 150),
    depositDate: row.deposit_date || "2026-08-31",
    paymentDate: inv.payment_date || "2026-09-02",
  });
  writeFileSync("/opt/cursor/artifacts/montaine-facture-acquittee.pdf", invoicePdf);

  const certBytes = new Uint8Array(await certBlob.arrayBuffer());
  const attBytes = new Uint8Array(await attBlob.arrayBuffer());

  const inscriptionCode = (row.code || "").trim() || "dossier FIF-PL";
  const variables = {
    student_name: studentName,
    language: row.language || "Anglais",
    inscription_code: inscriptionCode,
    end_date: formatFr(row.end_date!),
    invoice_number: inv.invoice_number!,
    survey_link: buildSurveyUrl(APP_URL, survey.token),
  };

  const subjectTpl =
    "Fin de votre formation {{language}} : certificat, attestation et facture";
  const htmlTpl = readFileSync(
    new URL(
      "../docs/emails-fli-2026-09/10a-training_completion_pack_student/training_completion_pack_student.html",
      import.meta.url
    ),
    "utf8"
  )
    // strip outer html chrome — body table only is already in DB; use docs html as source
    .replace(/^[\s\S]*?<body[^>]*>/i, "")
    .replace(/<\/body>[\s\S]*$/i, "")
    .trim();

  // Prefer DB template (validated)
  const { data: tpl } = await supabase
    .from("email_templates")
    .select("subject_fr, body_fr")
    .eq("slug", "training_completion_pack_student")
    .maybeSingle();

  const subject = applyTemplate(tpl?.subject_fr || subjectTpl, variables);
  const html = applyTemplate(tpl?.body_fr || htmlTpl, variables);

  const attachments = [
    {
      filename: "Certificat-fin-formation-Montaine-Gros-Deleglise.pdf",
      content: bytesToBase64(certBytes),
    },
    {
      filename: "Attestation-presence-FIFPL-Montaine-Gros-Deleglise.pdf",
      content: bytesToBase64(attBytes),
    },
    {
      filename: `Facture-acquittee-${inv.invoice_number}.pdf`,
      content: bytesToBase64(invoicePdf),
    },
  ];

  const draft = {
    to: email,
    bcc: FLI_NOTIFY_BCC,
    subject,
    student: { name: studentName, street, postalCode, city, phone: student.phone },
    variables,
    attachments: attachments.map((a) => a.filename),
    dryRun: DRY_RUN,
  };
  writeFileSync(
    "/opt/cursor/artifacts/montaine-end-pack-email-draft.json",
    JSON.stringify({ ...draft, htmlPreview: html.slice(0, 800) }, null, 2)
  );
  console.log(JSON.stringify(draft, null, 2));

  if (DRY_RUN) {
    console.log("DRY_RUN — aucun envoi Resend");
    return;
  }

  const resendBody = {
    from: FLI_FROM,
    to: [email],
    reply_to: [FLI_REPLY_TO],
    bcc: [FLI_NOTIFY_BCC],
    subject,
    html,
    attachments,
  };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resendBody),
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
    inscription_id: MONTAINE_INSCRIPTION_ID,
    variables_used: {
      ...variables,
      attachments: attachments.map((a) => a.filename),
      resend_id: resendId,
      resent_manual: true,
    },
  } as never);

  await supabase
    .from("inscriptions")
    .update({ end_pack_sent_at: new Date().toISOString() } as never)
    .eq("id", MONTAINE_INSCRIPTION_ID);

  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${responseText}`);
  }

  console.log(
    JSON.stringify({ ok: true, resendId, to: email, subject, attachments: draft.attachments }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

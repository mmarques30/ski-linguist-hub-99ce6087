/**
 * Renvoi résultat Thibault Dussenwart (Anna Tessier, B1) + facture 26-27.14341.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-thibault-dussenwart-renvoi.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch3";
const PDF_DIR = join(OUT, "pdfs");
const INV_DIR = join(OUT, "invoices");
const SENT_DIR = join(OUT, "sent-renvoi");
const BCC = "info@fli.fr";

const ROW = {
  key: "thibault-dussenwart",
  name: "Thibault Dussenwart",
  to: "thibault.dussenwart@hotmail.com",
  cc: ["contact@esf-courchevel.com", "direction@esf-courchevel.com"],
  cecrl: "B1",
  pdf: "evaluation-Thibault-Dussenwart-anglais-thibault-dussenwart.pdf",
  invoice: "Facture-26-27.14341-thibault-dussenwart-acquittee.pdf",
  invoice_number: "26-27.14341",
  subject: "Résultat de votre test de langue — Thibault Dussenwart",
};

function emailHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${ROW.cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${ROW.invoice_number} est jointe.</p>
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>
</td></tr>
</table>
</td></tr>
</table>`;
}

async function logEmail(resendId: string, sentAt: string) {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("email_log skip — service role key absente");
    return;
  }
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from("email_log").insert({
    template_slug: "test_result_esf_renvoi",
    recipient_email: ROW.to,
    recipient_name: ROW.name,
    status: "sent",
    sent_at: sentAt,
    variables_used: {
      cc: ROW.cc,
      bcc: BCC,
      cecrl: ROW.cecrl,
      lot: "mollard_oct_batch3_renvoi",
      note: "Renvoi demandé Paula 16/11 — formateur Anna Tessier",
      subject: ROW.subject,
      invoice: ROW.invoice_number,
      resend_id: resendId,
      instructor: "Anna Tessier",
    },
  });
  if (error) console.warn("email_log insert:", error.message);
  else console.log("email_log OK");
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(SENT_DIR, { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const pdfBytes = await readFile(join(PDF_DIR, ROW.pdf));
  const invBytes = await readFile(join(INV_DIR, ROW.invoice));
  const draft = {
    key: ROW.key,
    to: ROW.to,
    cc: ROW.cc,
    bcc: BCC,
    subject: ROW.subject,
    pdf: ROW.pdf,
    invoice: ROW.invoice,
    dry_run: !doSend,
    renvoi: true,
  };
  await writeFile(
    join(SENT_DIR, `${ROW.key}-draft.json`),
    JSON.stringify(draft, null, 2)
  );

  if (!doSend) {
    console.log(`DRY ${ROW.key} → ${ROW.to}`);
    console.log(JSON.stringify(draft, null, 2));
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/thibault-dussenwart-renvoi",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [ROW.to],
      cc: ROW.cc,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: ROW.subject,
      html: emailHtml(),
      attachments: [
        {
          filename: ROW.pdf,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
        {
          filename: ROW.invoice,
          content: Buffer.from(invBytes).toString("base64"),
        },
      ],
    }),
  });
  const text = await response.text();
  await writeFile(join(SENT_DIR, `${ROW.key}-resend.json`), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  const resendId = JSON.parse(text)?.id ?? null;
  const sentAt = new Date().toISOString();
  const sent = { ...draft, dry_run: false, sent_at: sentAt, resend_id: resendId };
  await writeFile(
    join(SENT_DIR, `${ROW.key}-sent.json`),
    JSON.stringify(sent, null, 2)
  );
  await logEmail(resendId, sentAt);
  console.log(`ENVOYE ${ROW.key} ${resendId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

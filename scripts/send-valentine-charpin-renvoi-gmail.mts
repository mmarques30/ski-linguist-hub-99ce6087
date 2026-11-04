/**
 * Renvoi résultat Valentine Charpin → charpinvalentine@gmail.com (sans CC ESF).
 * OK Paula 2026-11-04.
 *
 *   ./node_modules/.bin/tsx scripts/send-valentine-charpin-renvoi-gmail.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-valentine-charpin-renvoi-gmail.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch2/sent";
const PDF_DIR = "/opt/cursor/artifacts/mollard-oct-batch2/pdfs";
const INV_DIR = "/opt/cursor/artifacts/mollard-oct-batch2/invoices";

const TO = "charpinvalentine@gmail.com";
const BCC = "info@fli.fr";
const SUBJECT = "Résultat de votre test de langue — Valentine Charpin";
const CECRL = "B1";
const INVOICE_NUMBER = "26-27.14338";
const PDF = "evaluation-Valentine-Charpin-anglais-valentine-charpin.pdf";
const INVOICE = "Facture-26-27.14338-valentine-charpin-acquittee.pdf";

function emailHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${CECRL}).</p>
<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${INVOICE_NUMBER} est jointe.</p>
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

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });

  const pdfBytes = await readFile(join(PDF_DIR, PDF));
  const invBytes = await readFile(join(INV_DIR, INVOICE));
  const attachments = [
    { filename: PDF, content: Buffer.from(pdfBytes).toString("base64") },
    { filename: INVOICE, content: Buffer.from(invBytes).toString("base64") },
  ];

  const draft = {
    key: "valentine-charpin-renvoi-gmail",
    name: "Valentine Charpin",
    to: TO,
    cc: [] as string[],
    bcc: BCC,
    subject: SUBJECT,
    cecrl: CECRL,
    pdf: PDF,
    invoice: INVOICE,
    invoice_number: INVOICE_NUMBER,
    note: "Renvoi sans CC ESF — adresse gmail (OK Paula)",
    dry_run: !doSend,
  };
  await writeFile(join(OUT, "valentine-charpin-renvoi-gmail-draft.json"), JSON.stringify(draft, null, 2));
  console.log(`PJ ${PDF} (${pdfBytes.length} o)`);
  console.log(`PJ ${INVOICE} (${invBytes.length} o)`);

  if (!doSend) {
    console.log("Dry-run — relancer avec SEND=1.");
    return;
  }
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/valentine-charpin-renvoi-gmail",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      html: emailHtml(),
      attachments,
    }),
  });

  const text = await response.text();
  await writeFile(join(OUT, "valentine-charpin-renvoi-gmail-resend.json"), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);

  let resendId: string | null = null;
  try {
    resendId = JSON.parse(text)?.id ?? null;
  } catch {
    /* ignore */
  }

  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
    resend_status: response.status,
  };
  await writeFile(join(OUT, "valentine-charpin-renvoi-gmail-sent.json"), JSON.stringify(sent, null, 2));
  console.log(`ENVOYE ${resendId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

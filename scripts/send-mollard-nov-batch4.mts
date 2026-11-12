/**
 * Envoi lot Mollard nov. batch 4 (5 résultats).
 * Lit manifest.json produit par prepare-mollard-nov-batch4.mts.
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-mollard-nov-batch4.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-mollard-nov-batch4.mts
 *
 * Aucun envoi sans OK Paula.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-nov-batch4";
const PDF_DIR = join(OUT, "pdfs");
const INV_DIR = join(OUT, "invoices");
const BCC = "info@fli.fr";

type ManifestItem = {
  key: string;
  name: string;
  to: string;
  cc: string[];
  bcc: string;
  subject: string;
  cecrl: string;
  pdf: string;
  invoice: string | null;
  invoice_number: string | null;
  attachments: string[];
  blocked: boolean;
  note?: string | null;
};

function emailHtml(item: ManifestItem): string {
  const invoiceLine = item.invoice_number
    ? `<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${item.invoice_number} est jointe.</p>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${item.cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
${invoiceLine}
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
  const only = (process.env.ONLY ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await mkdir(join(OUT, "sent"), { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const manifest = JSON.parse(
    await readFile(join(OUT, "manifest.json"), "utf8")
  ) as { items: ManifestItem[] };

  const results: Array<Record<string, unknown>> = [];

  for (const item of manifest.items) {
    if (only.length && !only.includes(item.key)) continue;
    if (item.blocked) {
      console.log(`SKIP blocked ${item.key}`);
      results.push({ key: item.key, skipped: true, reason: "blocked" });
      continue;
    }

    const attachments: Array<{ filename: string; content: string }> = [];
    const pdfBytes = await readFile(join(PDF_DIR, item.pdf));
    attachments.push({
      filename: item.pdf,
      content: Buffer.from(pdfBytes).toString("base64"),
    });
    if (item.invoice) {
      const inv = await readFile(join(INV_DIR, item.invoice));
      attachments.push({
        filename: item.invoice,
        content: Buffer.from(inv).toString("base64"),
      });
    }

    const draft = {
      key: item.key,
      to: item.to,
      cc: item.cc,
      bcc: BCC,
      subject: item.subject,
      attachments: item.attachments,
      invoice_number: item.invoice_number,
      note: item.note ?? null,
      dry_run: !doSend,
    };
    await writeFile(
      join(OUT, "sent", `${item.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(
        `DRY ${item.key} → ${item.to} cc=${item.cc.join(",")} pj=${item.attachments.join("+")}`
      );
      results.push(draft);
      continue;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-nov-batch4",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [item.to],
        cc: item.cc,
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject: item.subject,
        html: emailHtml(item),
        attachments,
      }),
    });
    const text = await response.text();
    await writeFile(join(OUT, "sent", `${item.key}-resend.json`), text);
    if (!response.ok) {
      throw new Error(`${item.key} Resend ${response.status}: ${text}`);
    }
    const resendId = JSON.parse(text)?.id ?? null;
    const sent = {
      ...draft,
      dry_run: false,
      sent_at: new Date().toISOString(),
      resend_id: resendId,
    };
    await writeFile(
      join(OUT, "sent", `${item.key}-sent.json`),
      JSON.stringify(sent, null, 2)
    );
    results.push(sent);
    console.log(`ENVOYE ${item.key} ${resendId}`);
  }

  await writeFile(
    join(OUT, "sent", "batch4-summary.json"),
    JSON.stringify({ count: results.length, dry_run: !doSend, results }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

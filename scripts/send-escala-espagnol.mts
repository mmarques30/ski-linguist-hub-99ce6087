/**
 * Envoi résultat espagnol Iban Escala.
 * Lit manifest.json produit par prepare-escala-espagnol.mts.
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-escala-espagnol.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-escala-espagnol.mts
 *
 * Aucun envoi sans OK Paula.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/escala-espagnol";
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
  language?: string;
  pdf: string;
  invoice: string | null;
  invoice_number: string | null;
  attachments: string[];
  blocked: boolean;
  note?: string | null;
  html_extra?: string | null;
};

function emailHtml(item: ManifestItem): string {
  const invoiceLine = item.invoice_number
    ? `<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${item.invoice_number} est jointe.</p>`
    : "";
  const extra = item.html_extra?.trim()
    ? `<p style="margin:0 0 16px">${item.html_extra
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</p>`
    : "";
  const lang = (item.language || "espagnol").toLowerCase();
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'${lang} (${item.cecrl}).</p>
${extra}
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

  const raw = JSON.parse(
    await readFile(join(OUT, "manifest.json"), "utf8")
  ) as { items?: ManifestItem[] } | ManifestItem[];
  const manifest = Array.isArray(raw) ? raw : raw.items ?? [];

  for (const item of manifest) {
    if (only.length && !only.includes(item.key)) continue;
    if (item.blocked) {
      console.log(`SKIP ${item.key} (blocked)`);
      continue;
    }

    const files: { filename: string; content: Buffer }[] = [];
    for (const name of item.attachments) {
      const path = name.startsWith("Facture-")
        ? join(INV_DIR, name)
        : join(PDF_DIR, name);
      files.push({ filename: name, content: await readFile(path) });
    }

    if (!doSend) {
      console.log(
        `DRY ${item.key} → ${item.to} cc=${item.cc.join(",")} pj=${item.attachments.join("+")}`
      );
      continue;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [item.to],
        cc: item.cc,
        bcc: [item.bcc || BCC],
        subject: item.subject,
        html: emailHtml(item),
        attachments: files.map((f) => ({
          filename: f.filename,
          content: f.content.toString("base64"),
        })),
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      throw new Error(`Resend ${item.key}: ${res.status} ${JSON.stringify(json)}`);
    }
    await writeFile(
      join(OUT, "sent", `${item.key}.json`),
      JSON.stringify({ ...item, resend_id: json.id, sent_at: new Date().toISOString() }, null, 2)
    );
    console.log(`ENVOYE ${item.key} ${json.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

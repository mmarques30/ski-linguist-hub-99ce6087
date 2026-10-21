/**
 * Envoi lot Mollard/Tessier batch 2 (8 résultats ESF).
 * Régénère les PDF (layout nom sous titre) puis envoie via Resend.
 *
 *   ./node_modules/.bin/tsx scripts/send-mollard-oct-batch2.mts           # dry-run
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-mollard-oct-batch2.mts    # envoi réel
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch2";
const PDF_DIR = join(OUT, "pdfs");
const INV_DIR = join(OUT, "invoices");
const BCC = "info@fli.fr";

type ManifestItem = {
  key: string;
  name: string;
  email: string | null;
  school: string;
  cecrl: string;
  to: string;
  cc: string[];
  subject: string;
  pdf: string;
  invoice: string | null;
  invoice_number: string | null;
  stripe_charge: string | null;
  send_mode: string;
  blocked: boolean;
};

function emailHtml(name: string, cecrl: string, withInvoice: string | null): string {
  const invoiceLine = withInvoice
    ? `<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${withInvoice} est jointe.</p>`
    : "";
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
${invoiceLine}
<p style="margin:0 0 4px">Cordialement,</p>
<p style="margin:0">
  <strong>FLI — France Langues International</strong><br/>
  25 avenue de la Gare<br/>
  73800 Montmélian<br/>
  Tél. : 04 79 28 21 09<br/>
  <a href="mailto:info@fli.fr">info@fli.fr</a>
</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${body}
</td></tr>
</table>
</td></tr>
</table>`;
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "sent"), { recursive: true });

  // Toujours régénérer PDF + factures avec le layout courant.
  const prep = spawnSync(
    "./node_modules/.bin/tsx",
    ["scripts/prepare-mollard-oct-batch2.mts"],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  if (prep.status !== 0) {
    console.error(prep.stdout);
    console.error(prep.stderr);
    throw new Error(`prepare failed: ${prep.status}`);
  }
  console.log(prep.stdout.trim().split("\n").slice(-3).join("\n"));

  const manifest = JSON.parse(
    await readFile(join(OUT, "manifest.json"), "utf8")
  ) as { items: ManifestItem[] };

  const results: Array<Record<string, unknown>> = [];

  for (const item of manifest.items) {
    if (item.blocked || !item.email) {
      throw new Error(`Bloqué (email manquant) : ${item.key}`);
    }
    const pdfBytes = await readFile(join(PDF_DIR, item.pdf));
    const attachments: Array<{ filename: string; content: string }> = [
      { filename: item.pdf, content: Buffer.from(pdfBytes).toString("base64") },
    ];
    if (item.invoice) {
      const invBytes = await readFile(join(INV_DIR, item.invoice));
      attachments.push({
        filename: item.invoice,
        content: Buffer.from(invBytes).toString("base64"),
      });
    }

    const draft = {
      key: item.key,
      name: item.name,
      to: item.to,
      cc: item.cc,
      bcc: BCC,
      subject: item.subject,
      cecrl: item.cecrl,
      school: item.school,
      pdf: item.pdf,
      invoice: item.invoice,
      invoice_number: item.invoice_number,
      stripe_charge: item.stripe_charge,
      dry_run: !doSend,
      prepared_at: new Date().toISOString(),
    };
    await writeFile(
      join(OUT, "sent", `${item.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(
        `DRY ${item.key} → ${item.to} cc=${item.cc.join(",")} pj=${attachments.length}`
      );
      results.push(draft);
      continue;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY absente");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-oct-batch2",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [item.to],
        cc: item.cc,
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject: item.subject,
        html: emailHtml(item.name, item.cecrl, item.invoice_number),
        attachments,
      }),
    });
    const text = await response.text();
    await writeFile(join(OUT, "sent", `${item.key}-resend.json`), text);
    if (!response.ok) {
      throw new Error(`${item.key} Resend ${response.status}: ${text}`);
    }
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
    await writeFile(
      join(OUT, "sent", `${item.key}-sent.json`),
      JSON.stringify(sent, null, 2)
    );
    results.push(sent);
    console.log(`ENVOYE ${item.key} ${resendId}`);
  }

  await writeFile(
    join(OUT, "sent", "summary.json"),
    JSON.stringify({ count: results.length, dry_run: !doSend, results }, null, 2)
  );

  const md = [
    `# Envoi lot Mollard/Tessier batch 2`,
    ``,
    `- **Mode :** ${doSend ? "ENVOYÉ" : "dry-run"}`,
    `- **Bcc :** \`${BCC}\``,
    ``,
    ...results.map((r) => {
      const id = (r.resend_id as string) || "—";
      const inv = r.invoice_number ? ` · facture \`${r.invoice_number}\`` : "";
      return `- **${r.name}** (${r.cecrl}) → \`${r.to}\` · CC ${(r.cc as string[]).join(", ")} · Resend \`${id}\`${inv}`;
    }),
    ``,
  ].join("\n");
  await writeFile(join(OUT, "sent", "summary.md"), md);

  if (!doSend) {
    console.log("Dry-run OK — relancer avec SEND=1 pour envoyer.");
  } else {
    console.log(`ENVOI OK — ${results.length} mails`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

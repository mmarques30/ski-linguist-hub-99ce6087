/**
 * Envoi partiel batch 3 : Margot (école), Thibault (+ facture), Victor.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-mollard-oct-batch3-partial.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch3";
const PDF_DIR = join(OUT, "pdfs");
const INV_DIR = join(OUT, "invoices");
const BCC = "info@fli.fr";

type Row = {
  key: string;
  name: string;
  to: string;
  cc: string[];
  cecrl: string;
  pdf: string;
  invoice: string | null;
  invoice_number: string | null;
  school_only?: boolean;
};

const ROWS: Row[] = [
  {
    key: "margot-dumez",
    name: "Margot Dumez",
    to: "administration@esf-saintgervais.com",
    cc: [],
    cecrl: "A2+",
    pdf: "evaluation-Margot-Dumez-anglais-margot-dumez.pdf",
    invoice: null,
    invoice_number: null,
    school_only: true,
  },
  {
    key: "thibault-dussenwart",
    name: "Thibault Dussenwart",
    to: "thibault.dussenwart@hotmail.com",
    cc: ["contact@esf-courchevel.com", "direction@esf-courchevel.com"],
    cecrl: "B1",
    pdf: "evaluation-Thibault-Dussenwart-anglais-thibault-dussenwart.pdf",
    invoice: "Facture-26-27.14341-thibault-dussenwart-acquittee.pdf",
    invoice_number: "26-27.14341",
  },
  {
    key: "victor-dorn",
    name: "Victor Dorn",
    to: "victordorn@outlook.com",
    cc: ["administration@esf-saintgervais.com"],
    cecrl: "A2+",
    pdf: "evaluation-Victor-Dorn-anglais-victor-dorn.pdf",
    invoice: null,
    invoice_number: null,
  },
];

function emailHtml(row: Row): string {
  const invoiceLine = row.invoice_number
    ? `<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${row.invoice_number} est jointe.</p>`
    : "";
  const body = row.school_only
    ? `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat du test d'anglais de <strong>${row.name}</strong> (${row.cecrl}).</p>
<p style="margin:0 0 16px">Nous n'avons pas l'adresse e-mail du/de la candidat·e ; merci de lui transmettre ce document.</p>`
    : `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${row.cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
${invoiceLine}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${body}
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
  await mkdir(join(OUT, "sent"), { recursive: true });
  const apiKey = process.env.RESEND_API_KEY;
  if (doSend && !apiKey) throw new Error("RESEND_API_KEY absente");

  const results: Array<Record<string, unknown>> = [];

  for (const row of ROWS) {
    const pdfBytes = await readFile(join(PDF_DIR, row.pdf));
    const attachments: Array<{ filename: string; content: string }> = [
      { filename: row.pdf, content: Buffer.from(pdfBytes).toString("base64") },
    ];
    if (row.invoice) {
      const inv = await readFile(join(INV_DIR, row.invoice));
      attachments.push({
        filename: row.invoice,
        content: Buffer.from(inv).toString("base64"),
      });
    }
    const subject = row.school_only
      ? `Résultat test de langue — ${row.name} (ESF Saint-Gervais)`
      : `Résultat de votre test de langue — ${row.name}`;

    const draft = {
      key: row.key,
      to: row.to,
      cc: row.cc,
      bcc: BCC,
      subject,
      pdf: row.pdf,
      invoice: row.invoice,
      dry_run: !doSend,
    };
    await writeFile(
      join(OUT, "sent", `${row.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(`DRY ${row.key} → ${row.to}`);
      results.push(draft);
      continue;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-oct-batch3-partial",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [row.to],
        cc: row.cc,
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject,
        html: emailHtml(row),
        attachments,
      }),
    });
    const text = await response.text();
    await writeFile(join(OUT, "sent", `${row.key}-resend.json`), text);
    if (!response.ok) throw new Error(`${row.key} Resend ${response.status}: ${text}`);
    const resendId = JSON.parse(text)?.id ?? null;
    const sent = {
      ...draft,
      dry_run: false,
      sent_at: new Date().toISOString(),
      resend_id: resendId,
    };
    await writeFile(
      join(OUT, "sent", `${row.key}-sent.json`),
      JSON.stringify(sent, null, 2)
    );
    results.push(sent);
    console.log(`ENVOYE ${row.key} ${resendId}`);
  }

  await writeFile(
    join(OUT, "sent", "partial-summary.json"),
    JSON.stringify({ count: results.length, dry_run: !doSend, results }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

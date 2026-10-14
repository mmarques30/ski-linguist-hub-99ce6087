/**
 * Envoi résultats tests ESF Saint-Gervais (lot Mollard oct. 2026).
 * TO candidat · CC école · BCC info@fli.fr · PJ résultat uniquement (pas de facture).
 *
 *   ./node_modules/.bin/tsx scripts/send-st-gervais-results.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-st-gervais-results.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "/opt/cursor/artifacts/mollard-oct-2026/st-gervais-results";
const PDF_DIR = "/opt/cursor/artifacts/mollard-oct-2026/pdfs";
const SCHOOL_CC = ["administration@esf-saintgervais.com"];
const BCC = "info@fli.fr";

type Row = {
  key: string;
  name: string;
  email: string;
  cecrl: string;
  evaluation_id: string;
  pdf: string;
};

const ROWS: Row[] = [
  {
    key: "sacha-mir",
    name: "Sacha Mir-Emarati",
    email: "sachafmir@gmail.com",
    cecrl: "C1",
    evaluation_id: "c60e0f81-5572-4809-85e9-184e6ec7a121",
    pdf: "evaluation-Sacha-Mir-Emarati-anglais-sacha-mir.pdf",
  },
  {
    key: "anouk-leynaud",
    name: "Anouk Leynaud",
    email: "anouk.leynaud@gmail.com",
    cecrl: "B2",
    evaluation_id: "9c8c4ede-6d2b-4894-a334-354accd9daa2",
    pdf: "evaluation-Anouk-Leynaud-anglais-anouk-leynaud.pdf",
  },
  {
    key: "louise-labrousse",
    name: "Louise Labrousse",
    email: "louise.labrousse@gmail.com",
    cecrl: "B2",
    evaluation_id: "09126139-ae70-4f64-ad73-add9362b0bfc",
    pdf: "evaluation-Louise-Labrousse-anglais-louise-labrousse.pdf",
  },
  {
    key: "zoe-tollet",
    name: "Zoé Tollet",
    email: "zoetollet@icloud.com",
    cecrl: "B2",
    evaluation_id: "b80999ea-cdf4-4fe5-ba69-fa65850b15ee",
    pdf: "evaluation-Zoe-Tollet-anglais-zoe-tollet.pdf",
  },
  {
    key: "anouk-benamor",
    name: "Anouk Benamor",
    email: "anouck.benamor@gmail.com",
    cecrl: "B2",
    evaluation_id: "824c7d4c-8d16-471c-947c-52bfdff0eaff",
    pdf: "evaluation-Anouk-Benamor-anglais-anouk-benamor.pdf",
  },
];

function emailHtml(name: string, cecrl: string): string {
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
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

async function loadManifestIds(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(
      "/opt/cursor/artifacts/mollard-oct-2026/manifest.json",
      "utf8"
    );
    const list = JSON.parse(raw) as Array<{
      key: string;
      evaluation_id: string;
    }>;
    return Object.fromEntries(list.map((r) => [r.key, r.evaluation_id]));
  } catch {
    return {};
  }
}

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT_DIR, { recursive: true });

  const ids = await loadManifestIds();
  for (const row of ROWS) {
    if (ids[row.key]) row.evaluation_id = ids[row.key];
  }

  const results: Array<Record<string, unknown>> = [];

  for (const row of ROWS) {
    const pdfPath = join(PDF_DIR, row.pdf);
    const bytes = await readFile(pdfPath);
    const subject = `Résultat de votre test de langue — ${row.name}`;
    const draft = {
      key: row.key,
      to: row.email,
      cc: SCHOOL_CC,
      bcc: BCC,
      subject,
      attachment: row.pdf,
      cecrl: row.cecrl,
      school: "ESF SAINT GERVAIS",
      evaluation_id: row.evaluation_id,
      dry_run: !doSend,
      prepared_at: new Date().toISOString(),
    };
    await writeFile(
      join(OUT_DIR, `${row.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(`DRY ${row.key} → ${row.email} (${row.pdf}, ${bytes.length} o)`);
      results.push(draft);
      continue;
    }
    if (!apiKey) throw new Error("RESEND_API_KEY absente");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-st-gervais-results",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [row.email],
        cc: SCHOOL_CC,
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject,
        html: emailHtml(row.name, row.cecrl),
        attachments: [
          {
            filename: row.pdf,
            content: Buffer.from(bytes).toString("base64"),
          },
        ],
      }),
    });

    const text = await response.text();
    await writeFile(join(OUT_DIR, `${row.key}-resend.json`), text);
    if (!response.ok) {
      throw new Error(`${row.key} Resend ${response.status}: ${text}`);
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
      join(OUT_DIR, `${row.key}-sent.json`),
      JSON.stringify(sent, null, 2)
    );
    results.push(sent);
    console.log(`ENVOYE ${row.key} ${resendId}`);
  }

  await writeFile(
    join(OUT_DIR, "summary.json"),
    JSON.stringify(
      {
        school: "ESF SAINT GERVAIS",
        count: results.length,
        dry_run: !doSend,
        no_invoice: true,
        results,
      },
      null,
      2
    )
  );

  const md = [
    `# Résultats ESF Saint-Gervais — lot Mollard`,
    ``,
    `- **Sans facture** (facture école groupée plus tard)`,
    `- **Cc école :** \`${SCHOOL_CC[0]}\``,
    `- **Bcc :** \`${BCC}\``,
    `- **Mode :** ${doSend ? "ENVOYÉ" : "dry-run"}`,
    ``,
    ...results.map((r) => {
      const id = (r.resend_id as string) || "—";
      return `- **${r.key}** → \`${r.to}\` · ${r.cecrl} · Resend \`${id}\``;
    }),
    ``,
  ].join("\n");
  await writeFile(join(OUT_DIR, "summary.md"), md);

  if (!doSend) {
    console.log("Dry-run OK — relancer avec SEND=1 pour envoyer.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

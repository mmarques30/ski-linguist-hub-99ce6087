/**
 * ESF Saint-Gervais — tests italien 13/10/2026 (Nathalie Raguin).
 * Eliane Jeanbourquin + Louise Labrousse.
 * TO candidat · CC administration@esf-saintgervais.com · BCC info@fli.fr · PJ CR (pas de facture).
 *
 *   ./node_modules/.bin/tsx scripts/send-st-gervais-italien-1310.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-st-gervais-italien-1310.mts
 *
 * Eliane : poser ELIANE_EMAIL=… (absente en base).
 */
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/st-gervais-italien-1310";
const UPLOADS = "/home/ubuntu/.cursor/projects/workspace/uploads";
const BCC = "info@fli.fr";
const SCHOOL_CC = ["administration@esf-saintgervais.com"];

type Row = {
  key: string;
  name: string;
  email: string | null;
  cecrl: string;
  scoreGeneral: string;
  languageLabel: string;
  testDate: string;
  evaluator: string;
  pdfUpload: string;
  pdfOut: string;
  note?: string;
};

const ROWS: Row[] = [
  {
    key: "eliane-jeanbourquin",
    name: "Eliane Jeanbourquin",
    email: process.env.ELIANE_EMAIL?.trim() || null,
    cecrl: "B2",
    scoreGeneral: "3,25",
    languageLabel: "italien",
    testDate: "13/10/2026",
    evaluator: "Nathalie Raguin",
    pdfUpload: "Eliane_Jeanbourquin_CR_1c9e.pdf",
    pdfOut: "evaluation-Eliane-Jeanbourquin-italien.pdf",
    note: "Carte syndicale 2374 · scores 3 / 3,5 / 3 / 3,5 / 3 → générale 3,25",
  },
  {
    key: "louise-labrousse",
    name: "Louise Labrousse",
    email: "louise.labrousse@gmail.com",
    cecrl: "B1+",
    scoreGeneral: "2,75",
    languageLabel: "italien",
    testDate: "13/10/2026",
    evaluator: "Nathalie Raguin",
    pdfUpload: "Louise_Labrousse_ac07.pdf",
    pdfOut: "evaluation-Louise-Labrousse-italien.pdf",
    note:
      "Scores 3,5 / 2,5 / 2,5 / 2 / 3 → générale 2,75. Déjà reçu un résultat anglais Mollard le 14/10 — ceci est un 2e test (italien).",
  },
];

function emailHtml(row: Row): string {
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'italien (${row.cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski (ESF Saint-Gervais).</p>
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
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });

  const results: Array<Record<string, unknown>> = [];

  for (const row of ROWS) {
    const src = join(UPLOADS, row.pdfUpload);
    const dest = join(OUT, row.pdfOut);
    await copyFile(src, dest);
    const bytes = await readFile(dest);
    const subject = `Résultat de votre test de langue — ${row.name}`;
    const draft = {
      key: row.key,
      to: row.email,
      cc: SCHOOL_CC,
      bcc: BCC,
      subject,
      attachment: row.pdfOut,
      cecrl: row.cecrl,
      score_general: row.scoreGeneral,
      language: row.languageLabel,
      test_date: row.testDate,
      evaluator: row.evaluator,
      school: "ESF SAINT GERVAIS",
      no_invoice: true,
      note: row.note ?? null,
      dry_run: !doSend,
      prepared_at: new Date().toISOString(),
      pdf_bytes: bytes.length,
    };
    await writeFile(join(OUT, `${row.key}-draft.json`), JSON.stringify(draft, null, 2));

    if (!doSend) {
      console.log(
        `DRY ${row.key} → ${row.email ?? "⚠️ EMAIL MANQUANT"} (${row.pdfOut}, ${bytes.length} o)`
      );
      results.push(draft);
      continue;
    }
    if (!row.email) throw new Error(`${row.key}: e-mail candidat manquant`);
    if (!apiKey) throw new Error("RESEND_API_KEY absente");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/st-gervais-italien-1310",
      },
      body: JSON.stringify({
        from: "FLI — France Langues International <noreply@fli.fr>",
        to: [row.email],
        cc: SCHOOL_CC,
        bcc: [BCC],
        reply_to: ["info@fli.fr"],
        subject,
        html: emailHtml(row),
        attachments: [
          {
            filename: row.pdfOut,
            content: Buffer.from(bytes).toString("base64"),
          },
        ],
      }),
    });
    const text = await response.text();
    await writeFile(join(OUT, `${row.key}-resend.json`), text);
    if (!response.ok) throw new Error(`${row.key} Resend ${response.status}: ${text}`);
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
    await writeFile(join(OUT, `${row.key}-sent.json`), JSON.stringify(sent, null, 2));
    results.push(sent);
    console.log(`ENVOYE ${row.key} ${resendId}`);
  }

  const summary = {
    school: "ESF SAINT GERVAIS",
    language: "italien",
    test_date: "13/10/2026",
    evaluator: "Nathalie Raguin",
    count: results.length,
    dry_run: !doSend,
    no_invoice: true,
    cc: SCHOOL_CC,
    bcc: BCC,
    results,
  };
  await writeFile(join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

  const md = `# Brouillon — ESF Saint-Gervais italien 13/10/2026 — **À VALIDER — PAS ENVOYÉ**

Évaluatrice : Nathalie Raguin · CC école : \`${SCHOOL_CC.join("`, `")}\` · BCC : \`${BCC}\` · **sans facture** (facture école fin de mois).

| Candidat | E-mail | Niveau | PJ |
|----------|--------|--------|-----|
| Eliane Jeanbourquin | ${ROWS[0].email ?? "**⚠️ MANQUANT**"} | B2 (3,25) | \`${ROWS[0].pdfOut}\` |
| Louise Labrousse | ${ROWS[1].email} | B1+ (2,75) | \`${ROWS[1].pdfOut}\` |

## Corps (identique pour les 2)

Bonjour,

veuillez trouver ci-joint le résultat de votre test d'italien ([niveau]).

Une copie est adressée à votre école de ski (ESF Saint-Gervais).

Cordialement,
FLI — France Langues International

## Notes
- Louise a déjà reçu un résultat **anglais** (Mollard) le 14/10 — ce mail est le résultat **italien** du 13/10.
- Eliane : carte syndicale 2374 ; e-mail absent en base.
- Référentiel ESF Saint-Gervais : un seul mail école (\`administration@esf-saintgervais.com\`).
`;
  await writeFile(join(OUT, "email-draft.md"), md);
  console.log(`SUMMARY ${join(OUT, "summary.json")} dry_run=${!doSend}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

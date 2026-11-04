/**
 * Envoi Pierre Boes (Prosneige B2+) + Titouan Avocat (réévaluation B1).
 * Validation Paula 03/11/2026.
 *
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-mollard-oct-batch3-pierre-titouan.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "/opt/cursor/artifacts/mollard-oct-batch3";
const PDF_DIR = join(OUT, "pdfs");
const BCC = "info@fli.fr";

type Row = {
  key: string;
  name: string;
  to: string;
  cc: string[];
  cecrl: string;
  pdf: string;
  htmlExtra?: string;
};

const ROWS: Row[] = [
  {
    key: "pierre-boes",
    name: "Pierre Boes",
    to: "pierre_boes@yahoo.fr",
    cc: ["sam@prosneige.fr", "nathan@prosneige.fr"],
    cecrl: "B2+",
    pdf: "evaluation-Pierre-Boes-anglais-Prosneige.pdf",
  },
  {
    key: "titouan-avocat-reeval",
    name: "Titouan Avocat",
    to: "titouanavocat@gmail.com",
    cc: ["admin@esf-lescarroz.com", "directeur@esf-lescarroz.com"],
    cecrl: "B1",
    pdf: "evaluation-Titouan-Avocat-anglais-titouan-avocat-reeval.pdf",
    htmlExtra: `
<p style="margin:0 0 16px">Nous avons revu votre dossier après la réévaluation. Pour certaines compétences, la seconde note était inférieure à la première : nous avons choisi de conserver systématiquement la meilleure note.</p>
<p style="margin:0 0 16px">Ce que nous observons : il vous manque de fluidité à l'oral. Vous étiez clairement stressé lors du test ; cela se sent et joue contre vous. La prononciation n'est pas très claire. Globalement, la grammaire et l'explication des mouvements techniques vont ; c'est vraiment l'expression votre point faible.</p>
<p style="margin:0 0 16px">Il faut pratiquer beaucoup plus : écoute de podcasts, films et séries en VO, chansons, et prise de parole régulière.</p>`,
  },
];

function emailHtml(row: Row): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais (${row.cecrl}).</p>
${row.htmlExtra ?? ""}
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>
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
    const attachments = [
      { filename: row.pdf, content: Buffer.from(pdfBytes).toString("base64") },
    ];
    const subject = `Résultat de votre test de langue — ${row.name}`;
    const draft = {
      key: row.key,
      to: row.to,
      cc: row.cc,
      bcc: BCC,
      subject,
      pdf: row.pdf,
      cecrl: row.cecrl,
      dry_run: !doSend,
    };
    await writeFile(
      join(OUT, "sent", `${row.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(`DRY ${row.key} → ${row.to} cc=${row.cc.join(",")}`);
      results.push(draft);
      continue;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-oct-batch3-pierre-titouan",
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
    join(OUT, "sent", "pierre-titouan-summary.json"),
    JSON.stringify({ count: results.length, dry_run: !doSend, results }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

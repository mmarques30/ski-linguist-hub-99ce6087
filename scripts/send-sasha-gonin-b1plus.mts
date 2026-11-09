/**
 * Résultat Sasha Gonin-Porquez — test anglais B1+ (29/10/2026).
 * Paiement VIR INST 45 € du 22/10 confirmé. Envoi différé le 03/11 — à relancer.
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-sasha-gonin-b1plus.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-sasha-gonin-b1plus.mts
 *
 * Aucun envoi sans OK explicite Paula.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildEvaluationPdfModel,
  type CecrlScaleRow,
  type EvaluationPdfInput,
  type FliIdentity,
} from "../src/lib/evaluation-pdf.ts";
import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "../src/lib/evaluation-pdf-assets.ts";
import { renderEvaluationPdf } from "../src/lib/evaluation-pdf-render.ts";

const OUT = "/opt/cursor/artifacts/sasha-gonin-b1plus";
const DATA = join(process.cwd(), "scripts/data/mollard-oct-batch3-evals.json");
const BCC = "info@fli.fr";

const KEY = "sasha-gonin";
const TO = "goninporquezsasha@gmail.com";
const CC = ["ski@esfcourchevel.com", "sebdame@esfcourchevel.com"];
const SUBJECT = "Résultat de votre test de langue — Sasha Gonin-Porquez";
const PDF_NAME = "evaluation-Sasha-Gonin-Porquez-anglais-sasha-gonin.pdf";

const IDENTITY: FliIdentity = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
};

const SCALE: CecrlScaleRow[] = [
  { score: 0, cecrl_label: "A1", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 0.5, cecrl_label: "A1+", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Eveil" },
  { score: 1, cecrl_label: "A2", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 1.5, cecrl_label: "A2+", base_label: "A2", niveau: 1, description: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 2, cecrl_label: "B1", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 2.5, cecrl_label: "B1+", base_label: "B1", niveau: 2, description: "Intermédiaire / Autonomie" },
  { score: 3, cecrl_label: "B2", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 3.5, cecrl_label: "B2+", base_label: "B2", niveau: 3, description: "Post intermédiaire / Opérationnel" },
  { score: 4, cecrl_label: "C1", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 4.5, cecrl_label: "C1+", base_label: "C1", niveau: 4, description: "Perfectionnement / Fluidité / Aisance" },
  { score: 5, cecrl_label: "C2", base_label: "C2", niveau: 5, description: "Maîtrise" },
];

type Row = {
  key: string;
  name: string;
  email: string | null;
  school: string;
  carte: string | null;
  profession: string;
  test_at: string;
  scores: number[];
  cecrl: string;
  instructor_first_name: string;
  instructor_last_name: string;
  intro: string;
  comp: string;
  grammar: string;
  tech: string;
  points: string | null;
  concl: string;
  pdf_habillage: "esf" | "ecole_ski";
  previous_test?: boolean;
  note?: string;
};

async function loadAssets(): Promise<EvaluationPdfAssets> {
  const dir = join(process.cwd(), "public/evaluation-pdf");
  const read = async (file: string) => readFile(join(dir, file));
  const partners: Uint8Array[] = [];
  for (const file of EVALUATION_PDF_ASSET_FILES.partners) {
    partners.push(await read(file));
  }
  return {
    esfLogo: await read(EVALUATION_PDF_ASSET_FILES.esfLogo),
    fliHeader: await read(EVALUATION_PDF_ASSET_FILES.fliHeader),
    fliCachet: await read(EVALUATION_PDF_ASSET_FILES.fliCachet),
    fliCompact: await read(EVALUATION_PDF_ASSET_FILES.fliCompact),
    dsfLetterhead: await read(EVALUATION_PDF_ASSET_FILES.dsfLetterhead),
    partnerLogos: partners,
    fonts: {
      regular: await read(EVALUATION_PDF_ASSET_FILES.fonts.regular),
      bold: await read(EVALUATION_PDF_ASSET_FILES.fonts.bold),
      italic: await read(EVALUATION_PDF_ASSET_FILES.fonts.italic),
    },
  };
}

function bodyPlain(cecrl: string): string {
  return `Bonjour,

veuillez trouver ci-joint le résultat de votre test d'anglais (${cecrl}).

Une copie est adressée à votre école de ski.

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
}

function bodyHtml(cecrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
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
</p>
</td></tr>
</table>
</td></tr>
</table>`;
}

async function buildPdf(r: Row): Promise<Uint8Array> {
  const assets = await loadAssets();
  const [comp, expr, struct, tech, conv, gen] = r.scores;
  const input: EvaluationPdfInput = {
    sponsorType: r.pdf_habillage,
    evaluatedAt: new Date(r.test_at),
    candidateName: r.name,
    candidateProfession: r.profession,
    skiDiscipline: "alpin",
    trainingCycle: "1",
    carteSyndicale: r.carte,
    language: "anglais",
    previousTest: !!r.previous_test,
    skiSchoolName: r.school,
    companyName: r.school,
    instructorName: `${r.instructor_first_name} ${r.instructor_last_name}`,
    scores: {
      comprehension: comp,
      expression: expr,
      structure: struct,
      technique: tech,
      conversation: conv,
      general: gen,
    },
    cecrlGeneral: r.cecrl,
    blocs: {
      introduction: r.intro,
      comprehension: [r.comp, r.grammar].filter(Boolean).join(" "),
      technique: [r.tech, r.points].filter(Boolean).join(" "),
      conclusion: r.concl,
    },
    noteMethodologique: null,
    priceTtc: 45,
    identity: IDENTITY,
    cecrlScale: SCALE,
    verifiedAt: new Date(),
  };
  return renderEvaluationPdf(buildEvaluationPdfModel(input), assets);
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "pdfs"), { recursive: true });
  await mkdir(join(OUT, "sent"), { recursive: true });

  const rows = JSON.parse(await readFile(DATA, "utf8")) as Row[];
  const row = rows.find((r) => r.key === KEY);
  if (!row) throw new Error(`Clé ${KEY} absente de ${DATA}`);
  if (row.cecrl !== "B1+") {
    throw new Error(`Niveau inattendu pour ${KEY}: ${row.cecrl} (attendu B1+)`);
  }

  const pdfBytes = await buildPdf(row);
  await writeFile(join(OUT, "pdfs", PDF_NAME), pdfBytes);
  console.log(`PDF OK ${PDF_NAME} (${pdfBytes.length} octets)`);

  const draft = {
    key: KEY,
    name: row.name,
    to: TO,
    cc: CC,
    bcc: BCC,
    subject: SUBJECT,
    cecrl: row.cecrl,
    test_at: row.test_at,
    school: row.school,
    scores: row.scores,
    payment: "VIR INST 45 € 22/10/2026 (réf. test 29 octobre)",
    previous_result_sent: "B1 envoyé 14/10 (virement 03/09)",
    pdf: PDF_NAME,
    attachments: [PDF_NAME],
    body: bodyPlain(row.cecrl),
    dry_run: !doSend,
    note:
      row.note ??
      "Nouveau test 29/10 — envoi différé le 03/11 ; brouillon relance.",
  };

  await writeFile(
    join(OUT, "sent", `${KEY}-draft.json`),
    JSON.stringify(draft, null, 2)
  );
  await writeFile(
    join(OUT, "sent", `${KEY}-draft.md`),
    `# Brouillon — ${SUBJECT}

**Aucun envoi sans OK Paula.** Dry-run = \`${!doSend}\`.

| Champ | Valeur |
|---|---|
| **To** | \`${TO}\` |
| **Cc** | \`${CC.join("`, `")}\` |
| **Bcc** | \`${BCC}\` |
| **Objet** | ${SUBJECT} |
| **Niveau** | ${row.cecrl} |
| **Test** | ${row.test_at} · ${row.school} · Carole Mollard |
| **Paiement** | VIR INST 45 € du 22/10/2026 |
| **PJ** | \`${PDF_NAME}\` (${pdfBytes.length} octets) |

## Corps

\`\`\`
${bodyPlain(row.cecrl)}
\`\`\`

## Contexte

- Ancien résultat **B1** (test 12/10) déjà envoyé le **14/10** (virement 03/09).
- Nouveau résultat **B1+** (test 29/10) — différé le 03/11 alors que le paiement était confirmé.
`
  );

  console.log(`Draft → ${join(OUT, "sent", `${KEY}-draft.md`)}`);

  if (!doSend) {
    console.log(`DRY ${KEY} → ${TO} cc=${CC.join(",")}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/sasha-gonin-b1plus",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      cc: CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      html: bodyHtml(row.cecrl),
      attachments: [
        {
          filename: PDF_NAME,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    }),
  });
  const text = await response.text();
  await writeFile(join(OUT, "sent", `${KEY}-resend.json`), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  const resendId = JSON.parse(text)?.id ?? null;
  const sent = {
    ...draft,
    dry_run: false,
    sent_at: new Date().toISOString(),
    resend_id: resendId,
  };
  await writeFile(
    join(OUT, "sent", `${KEY}-sent.json`),
    JSON.stringify(sent, null, 2)
  );
  console.log(`ENVOYE ${KEY} ${resendId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Résultat + facture acquittée — Sasha Gonin-Porquez, test anglais B1+ (29/10/2026).
 * Paiement VIR INST 45 € du 22/10. Facture n° 26-27.14344.
 *
 *   Dry-run : ./node_modules/.bin/tsx scripts/send-sasha-gonin-b1plus.mts
 *   Envoi   : SEND=1 ./node_modules/.bin/tsx scripts/send-sasha-gonin-b1plus.mts
 *
 * Aucun envoi sans OK explicite Paula.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
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
const INVOICE_NUMBER = "26-27.14344";
const INVOICE_DATE = "2026-10-29";
const PAYMENT_DATE = "2026-10-22";
const INVOICE_NAME = `Facture-${INVOICE_NUMBER}-sasha-gonin-acquittee.pdf`;

const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);
const GREEN = rgb(0.1, 0.45, 0.2);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  tvaNumber: "FR 44 484772041",
  activity: "82 73 01 366 73",
} as const;

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

function formatEuro(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function loadPublic(rel: string): Promise<Uint8Array | null> {
  try {
    return await readFile(join(process.cwd(), "public", rel));
  } catch {
    return null;
  }
}

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

La facture acquittée n° ${INVOICE_NUMBER} est jointe.

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
<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${INVOICE_NUMBER} est jointe.</p>
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

async function buildResultPdf(r: Row): Promise<Uint8Array> {
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

async function buildPaidInvoicePdf(clientName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const left = 48;
  const right = 547;
  let y = 790;

  const draw = (
    text: string,
    x: number,
    yy: number,
    o?: { bold?: boolean; size?: number; color?: typeof INK }
  ) => {
    page.drawText(text, {
      x,
      y: yy,
      size: o?.size ?? 10,
      font: o?.bold ? fontBold : font,
      color: o?.color ?? INK,
    });
  };

  const headerBytes = await loadPublic("evaluation-pdf/fli-entete-prosneige.png");
  if (headerBytes?.byteLength) {
    try {
      const img = await doc.embedPng(headerBytes);
      const w = 220;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: left, y: y - h, width: w, height: h });
      y -= h + 16;
    } catch {
      draw(FLI.name, left, y, { bold: true, size: 14 });
      y -= 28;
    }
  } else {
    draw(FLI.name, left, y, { bold: true, size: 14 });
    y -= 28;
  }

  draw(FLI.address, left, y, { size: 9, color: MUTED });
  y -= 12;
  draw(FLI.city, left, y, { size: 9, color: MUTED });
  y -= 12;
  draw(`Tél. ${FLI.phone} · ${FLI.email}`, left, y, { size: 9, color: MUTED });
  y -= 28;

  draw("FACTURE", left, y, { bold: true, size: 18, color: YELLOW });
  y -= 22;
  draw(`N° ${INVOICE_NUMBER}`, left, y, { bold: true, size: 12 });
  draw(`Date : ${formatFr(INVOICE_DATE)}`, right - 140, y, { size: 10 });
  y -= 28;

  page.drawRectangle({
    x: left,
    y: y - 50,
    width: right - left,
    height: 58,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(clientName, left + 12, y - 30, { bold: true, size: 11 });
  y -= 76;

  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 2, color: YELLOW });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Qté", left + 280, y, { bold: true, size: 9, color: MUTED });
  draw("Prix unit.", left + 330, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;
  const amountHt = 37.5;
  const tvaRate = 20;
  const tvaAmount = 7.5;
  const amountTtc = 45;
  draw("Test d'anglais", left, y, { size: 10 });
  draw("1", left + 290, y, { size: 10 });
  draw(formatEuro(amountHt), left + 330, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, { bold: true, size: 10 });
  y -= 36;

  const boxX = right - 220;
  const row = (
    label: string,
    value: string,
    o?: { bold?: boolean; color?: typeof INK; size?: number }
  ) => {
    draw(label, boxX, y, {
      size: o?.size ?? 10,
      bold: o?.bold,
      color: o?.color ?? MUTED,
    });
    const vw = (o?.bold ? fontBold : font).widthOfTextAtSize(value, o?.size ?? 10);
    draw(value, right - vw, y, {
      size: o?.size ?? 10,
      bold: o?.bold,
      color: o?.color ?? INK,
    });
    y -= 16;
  };
  row("Total HT", formatEuro(amountHt));
  row(`TVA (${tvaRate}%)`, formatEuro(tvaAmount));
  page.drawLine({ start: { x: boxX, y }, end: { x: right, y }, thickness: 2, color: YELLOW });
  y -= 18;
  row("Total TTC", formatEuro(amountTtc), { bold: true, color: YELLOW, size: 12 });
  row("Net à payer", formatEuro(0), { bold: true, color: GREEN, size: 12 });

  const stampBytes = await loadPublic("inscription-documents/facture-acquittee-stamp.png");
  if (stampBytes?.byteLength) {
    try {
      const stamp = await doc.embedPng(stampBytes);
      const w = 120;
      const h = (stamp.height / stamp.width) * w;
      page.drawImage(stamp, {
        x: 595.28 / 2 - w / 2,
        y: 280,
        width: w,
        height: h,
        opacity: 0.35,
      });
    } catch {
      /* optional */
    }
  }

  y = Math.min(y - 24, 220);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  draw("RÈGLEMENT", left, y, { size: 8, color: MUTED, bold: true });
  draw("Facture acquittée", left, y - 14, { bold: true, size: 11, color: GREEN });
  draw(`Date : ${formatFr(PAYMENT_DATE)}`, left, y - 28, { size: 9 });
  draw("Moyen : Virement bancaire", left, y - 40, { size: 9 });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, { size: 9, color: MUTED });

  const footer = [
    "France Langues International - organisme de formation",
    "SARL au capital de 5000 euros — 25 avenue de la gare, 73800 Montmélian",
    `Siret : ${FLI.siret} - RCS Chambéry - NAF : 8559A — Organisme n° ${FLI.activity}`,
    "Version 5 du 10 janvier 2026",
  ];
  let fy = 70;
  for (const line of footer) {
    const w = font.widthOfTextAtSize(line, 7);
    draw(line, (595.28 - w) / 2, fy, { size: 7, color: MUTED });
    fy -= 10;
  }
  return doc.save();
}

async function main() {
  const doSend = process.env.SEND === "1";
  await mkdir(join(OUT, "pdfs"), { recursive: true });
  await mkdir(join(OUT, "invoices"), { recursive: true });
  await mkdir(join(OUT, "sent"), { recursive: true });

  const rows = JSON.parse(await readFile(DATA, "utf8")) as Row[];
  const row = rows.find((r) => r.key === KEY);
  if (!row) throw new Error(`Clé ${KEY} absente de ${DATA}`);
  if (row.cecrl !== "B1+") {
    throw new Error(`Niveau inattendu pour ${KEY}: ${row.cecrl} (attendu B1+)`);
  }

  const pdfBytes = await buildResultPdf(row);
  await writeFile(join(OUT, "pdfs", PDF_NAME), pdfBytes);
  console.log(`PDF OK ${PDF_NAME} (${pdfBytes.length} octets)`);

  const invBytes = await buildPaidInvoicePdf(row.name);
  await writeFile(join(OUT, "invoices", INVOICE_NAME), invBytes);
  console.log(`INV OK ${INVOICE_NAME} (${invBytes.length} octets)`);

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
    invoice_number: INVOICE_NUMBER,
    invoice_date: INVOICE_DATE,
    payment_date: PAYMENT_DATE,
    previous_result_sent: "B1 envoyé 14/10 (virement 03/09)",
    pdf: PDF_NAME,
    invoice: INVOICE_NAME,
    attachments: [PDF_NAME, INVOICE_NAME],
    body: bodyPlain(row.cecrl),
    dry_run: !doSend,
    note:
      row.note ??
      "Nouveau test 29/10 — résultat + facture acquittée.",
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
| **Facture** | \`${INVOICE_NUMBER}\` (acquittée · virement) |
| **PJ** | \`${PDF_NAME}\` · \`${INVOICE_NAME}\` |

## Corps

\`\`\`
${bodyPlain(row.cecrl)}
\`\`\`

## Contexte

- Ancien résultat **B1** (test 12/10) déjà envoyé le **14/10** (virement 03/09).
- Nouveau résultat **B1+** (test 29/10) + facture acquittée **${INVOICE_NUMBER}**.
`
  );

  console.log(`Draft → ${join(OUT, "sent", `${KEY}-draft.md`)}`);

  if (!doSend) {
    console.log(`DRY ${KEY} → ${TO} cc=${CC.join(",")} + facture ${INVOICE_NUMBER}`);
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
        {
          filename: INVOICE_NAME,
          content: Buffer.from(invBytes).toString("base64"),
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

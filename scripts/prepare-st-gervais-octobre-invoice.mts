/**
 * Facture école octobre 2026 — ESF Saint-Gervais + tableau des niveaux.
 * Génère PDF / DOCX / brouillon mail (aucun envoi ici).
 * Envoi Resend : scripts/send-st-gervais-octobre-invoice.mts (SEND=1 après OK Paula).
 *
 *   ./node_modules/.bin/tsx scripts/prepare-st-gervais-octobre-invoice.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  buildFliBankDetailsEmailHtml,
  buildPaymentLinkWithBankDetailsEmailHtml,
  FLI_BANK_DETAILS,
  isValidIban,
} from "../src/lib/registration-payments.ts";

const DATA = join(process.cwd(), "scripts/data/st-gervais-octobre-2026.json");
const OUT = "/opt/cursor/artifacts/st-gervais-octobre-2026";

const YELLOW = rgb(252 / 255, 175 / 255, 23 / 255);
const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.35, 0.35, 0.35);

const FLI = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
  siret: "484 772 041 00048",
  tvaNumber: "FR 82 484772041",
  iban: FLI_BANK_DETAILS.iban,
  bic: FLI_BANK_DETAILS.bic,
  activity: "82 73 01366 73",
} as const;

const CLIENT = {
  name: "ESF SAINT GERVAIS LES BAINS",
  address: "Maison de St Gervais — 43 rue du Mont Blanc",
  postalCode: "74170",
  city: "SAINT-GERVAIS-LES-BAINS",
};

type Candidate = {
  name: string;
  language: string;
  test_date: string;
  evaluator: string;
  scores: number[];
  cecrl: string;
};

type Pack = {
  school: string;
  director_name?: string;
  to: string[];
  cc: string[];
  bcc: string;
  tutoiement?: boolean;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  unit_ht: number;
  checkout_url?: string | null;
  stripe_payment_link?: string | null;
  candidates: Candidate[];
};

const CECRL_QUALIFIER: Record<string, string> = {
  A1: "Faux débutant",
  "A1+": "Faux débutant",
  A2: "Élémentaire",
  "A2+": "Élémentaire",
  B1: "Autonomie",
  "B1+": "Autonomie",
  B2: "Opérationnel",
  "B2+": "Opérationnel",
  C1: "Fluidité",
  "C1+": "Fluidité",
  C2: "Maîtrise",
};

function formatFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatEuro(amount: number): string {
  const fixed = amount.toFixed(2).replace(".", ",");
  const [intPart, dec] = fixed.split(",");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${withSpaces},${dec}\u00a0€`;
}

function scoreFr(n: number): string {
  return String(n).replace(".", ",");
}

async function loadPublic(path: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(join(process.cwd(), "public", path)));
  } catch {
    return null;
  }
}

async function embedFonts(doc: PDFDocument): Promise<{
  font: PDFFont;
  fontBold: PDFFont;
}> {
  doc.registerFontkit(fontkit);
  const regular = await loadPublic("fonts/Inter-Regular.ttf");
  const bold = await loadPublic("fonts/Inter-SemiBold.ttf");
  if (regular?.byteLength && bold?.byteLength) {
    return {
      font: await doc.embedFont(regular, { subset: true }),
      fontBold: await doc.embedFont(bold, { subset: true }),
    };
  }
  return {
    font: await doc.embedFont(StandardFonts.Helvetica),
    fontBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

async function buildInvoicePdf(pack: Pack): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const { font, fontBold } = await embedFonts(doc);
  const pageSize: [number, number] = [595.28, 841.89];
  let page = doc.addPage(pageSize);
  const left = 48;
  const right = pageSize[0] - 48;
  let y = pageSize[1] - 48;

  const ensureSpace = (need: number) => {
    if (y - need < 80) {
      page = doc.addPage(pageSize);
      y = pageSize[1] - 48;
    }
  };

  const draw = (
    text: string,
    x: number,
    baseline: number,
    opts?: { bold?: boolean; size?: number; color?: typeof INK; page?: typeof page }
  ) => {
    const p = opts?.page ?? page;
    p.drawText(text, {
      x,
      y: baseline,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? INK,
    });
  };

  const logoBytes = await loadPublic("inscription-documents/fli-invoice-logo.png");
  if (logoBytes?.byteLength) {
    try {
      const logo = await doc.embedPng(logoBytes);
      const w = 140;
      const h = (logo.height / logo.width) * w;
      page.drawImage(logo, { x: left, y: y - h, width: w, height: h });
      y -= h + 8;
    } catch {
      draw(FLI.name, left, y - 14, { bold: true, size: 12 });
      y -= 20;
    }
  } else {
    draw(FLI.name, left, y - 14, { bold: true, size: 12 });
    y -= 20;
  }

  const headerTop = pageSize[1] - 52;
  draw("FACTURE - Tests de niveau", right - 210, headerTop - 4, {
    bold: true,
    size: 13,
    color: YELLOW,
  });
  draw(`N°: ${pack.invoice_number}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(pack.invoice_date)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });
  draw(`Échéance: ${formatFr(pack.due_date)}`, right - 140, headerTop - 50, {
    size: 9,
    color: MUTED,
  });

  for (const line of [FLI.name, FLI.address, FLI.city, `Tél: ${FLI.phone}`, FLI.email]) {
    draw(line, left, y, {
      size: 9,
      color: line === FLI.name ? INK : MUTED,
      bold: line === FLI.name,
    });
    y -= 12;
  }
  y -= 10;

  page.drawRectangle({
    x: left,
    y: y - 2,
    width: right - left,
    height: 2.5,
    color: YELLOW,
  });
  y -= 24;

  page.drawRectangle({
    x: left,
    y: y - 70,
    width: right - left,
    height: 78,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(CLIENT.name, left + 12, y - 30, { bold: true, size: 11 });
  draw(CLIENT.address, left + 12, y - 44, { size: 9 });
  draw(`${CLIENT.postalCode} ${CLIENT.city}`, left + 12, y - 56, { size: 9 });
  y -= 96;

  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 16;
  draw("Description", left, y, { bold: true, size: 9, color: MUTED });
  draw("Qté", left + 300, y, { bold: true, size: 9, color: MUTED });
  draw("Prix unit.", left + 345, y, { bold: true, size: 9, color: MUTED });
  draw("Montant", right - 60, y, { bold: true, size: 9, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;

  for (const c of pack.candidates) {
    ensureSpace(24);
    const desc = `Test de ${c.language.toLowerCase()} — ${c.name} (${formatFr(c.test_date)})`;
    draw(desc, left, y, { size: 9 });
    draw("1", left + 310, y, { size: 9 });
    const unit = formatEuro(pack.unit_ht);
    draw(unit, left + 345, y, { size: 9 });
    const tot = formatEuro(pack.unit_ht);
    const totW = fontBold.widthOfTextAtSize(tot, 9);
    draw(tot, right - totW, y, { bold: true, size: 9 });
    y -= 18;
  }

  y -= 12;
  ensureSpace(120);
  const amountHt = pack.unit_ht * pack.candidates.length;
  const tvaRate = 20;
  const tvaAmount = (amountHt * tvaRate) / 100;
  const amountTtc = amountHt + tvaAmount;
  const boxX = right - 220;
  const row = (label: string, value: string, opts?: { bold?: boolean; color?: typeof INK; size?: number }) => {
    draw(label, boxX, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? MUTED,
    });
    const vw = (opts?.bold ? fontBold : font).widthOfTextAtSize(value, opts?.size ?? 10);
    draw(value, right - vw, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? INK,
    });
    y -= 16;
  };
  row("Total HT", formatEuro(amountHt));
  row(`TVA (${tvaRate}%)`, formatEuro(tvaAmount));
  page.drawLine({
    start: { x: boxX, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
  y -= 18;
  row("Total TTC", formatEuro(amountTtc), { bold: true, color: YELLOW, size: 12 });

  y = Math.min(y - 24, 200);
  page.drawLine({
    start: { x: left, y: y + 12 },
    end: { x: right, y: y + 12 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  draw("COORDONNÉES BANCAIRES", left, y, { size: 8, color: MUTED, bold: true });
  draw(`IBAN: ${FLI.iban}`, left, y - 14, { size: 9 });
  draw(`BIC: ${FLI.bic}`, left, y - 28, { size: 9 });
  draw(`Réf. à indiquer: ${pack.invoice_number}`, left, y - 42, { size: 9 });
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
    draw(line, (pageSize[0] - w) / 2, fy, { size: 7, color: MUTED });
    fy -= 10;
  }

  return doc.save();
}

function levelsRows(pack: Pack) {
  return pack.candidates.map((c) => {
    const [comp, expr, struct, tech, conv, gen] = c.scores;
    const qual = CECRL_QUALIFIER[c.cecrl] ?? "";
    return {
      name: c.name,
      school: pack.school,
      language: c.language,
      date: formatFr(c.test_date),
      evaluator: c.evaluator,
      comprehension: scoreFr(comp),
      expression: scoreFr(expr),
      structures: scoreFr(struct),
      technique: scoreFr(tech),
      conversation: scoreFr(conv),
      niveau_final: `${scoreFr(gen)} — ${qual}`,
      cecrl: c.cecrl,
    };
  });
}

async function writeLevelsCsv(pack: Pack, path: string) {
  const headers = [
    "Nom",
    "École",
    "Langue",
    "Date",
    "Évaluateur",
    "Compréhension",
    "Expression",
    "Structures",
    "Technique",
    "Conversation",
    "Niveau final",
    "CECRL",
  ];
  const lines = [headers.join(";")];
  for (const r of levelsRows(pack)) {
    lines.push(
      [
        r.name,
        r.school,
        r.language,
        r.date,
        r.evaluator,
        r.comprehension,
        r.expression,
        r.structures,
        r.technique,
        r.conversation,
        r.niveau_final,
        r.cecrl,
      ].join(";")
    );
  }
  await writeFile(path, lines.join("\n") + "\n", "utf8");
}

function buildLevelsDocx(csvPath: string, docxPath: string, pack: Pack) {
  const py = `
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import csv

doc = Document()
section = doc.sections[0]
section.page_width = Cm(29.7)
section.page_height = Cm(21.0)
section.left_margin = Cm(1.2)
section.right_margin = Cm(1.2)
section.top_margin = Cm(1.2)
section.bottom_margin = Cm(1.2)

title = doc.add_paragraph()
run = title.add_run("Tableau des niveaux — ESF Saint-Gervais — octobre 2026")
run.bold = True
run.font.size = Pt(13)
run.font.color.rgb = RGBColor(0xC8, 0x8B, 0x17)

sub = doc.add_paragraph()
run = sub.add_run("Facture ${pack.invoice_number} · ${pack.candidates.length} tests · FLI — France Langues International")
run.font.size = Pt(10)
run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

with open(${JSON.stringify(csvPath)}, encoding="utf-8") as f:
    rows = list(csv.reader(f, delimiter=";"))

table = doc.add_table(rows=len(rows), cols=len(rows[0]))
table.style = "Table Grid"
for ri, row in enumerate(rows):
    for ci, val in enumerate(row):
        cell = table.rows[ri].cells[ci]
        cell.text = val
        for p in cell.paragraphs:
            for r in p.runs:
                r.font.size = Pt(8)
                r.bold = ri == 0

doc.save(${JSON.stringify(docxPath)})
print("DOCX", ${JSON.stringify(docxPath)})
`;
  const res = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`python-docx failed: ${res.stderr || res.stdout}`);
  }
  console.log(res.stdout.trim());
}

async function main() {
  const pack = JSON.parse(await readFile(DATA, "utf8")) as Pack;
  await mkdir(OUT, { recursive: true });

  const amountHt = pack.unit_ht * pack.candidates.length;
  const amountTtc = amountHt * 1.2;

  const invoiceBytes = await buildInvoicePdf(pack);
  const invoiceName = `Facture-${pack.invoice_number}-ESF-Saint-Gervais-octobre.pdf`;
  await writeFile(join(OUT, invoiceName), invoiceBytes);
  console.log("PDF", invoiceName, invoiceBytes.length);

  const csvName = "tableau-niveaux-ESF-Saint-Gervais-octobre-2026.csv";
  const docxName = "tableau-niveaux-ESF-Saint-Gervais-octobre-2026.docx";
  await writeLevelsCsv(pack, join(OUT, csvName));
  buildLevelsDocx(join(OUT, csvName), join(OUT, docxName), pack);

  const listHtml = pack.candidates
    .map(
      (c) =>
        `<li>${c.name} — ${c.language.toLowerCase()} (${formatFr(c.test_date)}) · ${c.cecrl}</li>`
    )
    .join("\n");

  if (!isValidIban(FLI_BANK_DETAILS.iban) || !FLI_BANK_DETAILS.iban.replace(/\s/g, "").endsWith("189")) {
    throw new Error(`IBAN FLI invalide ou pas …189 : ${FLI_BANK_DETAILS.iban}`);
  }

  const checkoutUrl = (pack.checkout_url || "").trim();
  const paymentHtml = checkoutUrl
    ? buildPaymentLinkWithBankDetailsEmailHtml({
        checkoutUrl,
        amountLabel: formatEuro(amountTtc),
        reference: pack.invoice_number,
        onlineIntroHtml: `Pour régler <strong>${formatEuro(amountTtc)}</strong> en ligne (carte), utilisez ce lien sécurisé&nbsp;:`,
      })
    : `${buildFliBankDetailsEmailHtml(pack.invoice_number)}
<p style="margin:0 0 16px">Merci de bien vouloir procéder au règlement par virement en indiquant la référence de facture.</p>`;

  const subject = `Facture ${pack.invoice_number} — Tests de langue octobre 2026 — ESF Saint-Gervais`;
  const greeting = pack.tutoiement
    ? `Bonjour${pack.director_name ? ` ${pack.director_name.split(" ")[0]}` : ""},`
    : "Bonjour,";
  const paymentText = checkoutUrl
    ? `Paiement en ligne (carte) :
${checkoutUrl}

Ou par virement :
Bénéficiaire : ${FLI_BANK_DETAILS.beneficiary}
IBAN : ${FLI_BANK_DETAILS.iban}
BIC : ${FLI_BANK_DETAILS.bic}
Banque : ${FLI_BANK_DETAILS.bank}
Référence à indiquer : ${pack.invoice_number}`
    : `Coordonnées bancaires FLI :
Bénéficiaire : ${FLI_BANK_DETAILS.beneficiary}
IBAN : ${FLI_BANK_DETAILS.iban}
BIC : ${FLI_BANK_DETAILS.bic}
Banque : ${FLI_BANK_DETAILS.bank}
Référence à indiquer : ${pack.invoice_number}

Merci de bien vouloir procéder au règlement par virement en indiquant la référence de facture.`;

  const bodyText = `${greeting}

voici la facture complète des tests de langue d'octobre 2026 pour l'ESF Saint-Gervais (${pack.candidates.length} tests), avec le tableau récapitulatif des niveaux.

Montant : ${formatEuro(amountTtc)} TTC (${formatEuro(amountHt)} HT + TVA 20 %).
Échéance : ${formatFr(pack.due_date)}.

Candidats :
${pack.candidates.map((c) => `- ${c.name} — ${c.language} (${formatFr(c.test_date)}) · ${c.cecrl}`).join("\n")}

${paymentText}

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;

  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">${greeting}</p>
<p style="margin:0 0 16px">voici la facture complète <strong>${pack.invoice_number}</strong> des tests de langue d'octobre&nbsp;2026 pour l'ESF Saint-Gervais (${pack.candidates.length}&nbsp;tests), avec le tableau récapitulatif des niveaux.</p>
<ul style="margin:0 0 16px;padding-left:20px">
${listHtml}
</ul>
<p style="margin:0 0 16px">Montant : <strong>${formatEuro(amountTtc)} TTC</strong> (${formatEuro(amountHt)} HT + TVA 20&nbsp;%).<br/>Échéance : ${formatFr(pack.due_date)}.</p>
${paymentHtml}
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

  const draft = {
    status: "ready_awaiting_paula_ok",
    do_not_send: true,
    to: pack.to,
    cc: pack.cc,
    bcc: pack.bcc,
    subject,
    invoice_number: pack.invoice_number,
    invoice_date: pack.invoice_date,
    due_date: pack.due_date,
    amount_ht: amountHt,
    amount_ttc: amountTtc,
    count: pack.candidates.length,
    attachments: [invoiceName, docxName, csvName],
    checkout_url: checkoutUrl || null,
    stripe_payment_link: pack.stripe_payment_link ?? null,
    iban: FLI_BANK_DETAILS.iban,
    iban_ends_189: FLI_BANK_DETAILS.iban.replace(/\s/g, "").endsWith("189"),
    iban_checksum_ok: isValidIban(FLI_BANK_DETAILS.iban),
    body_text: bodyText,
  };
  await writeFile(join(OUT, "draft.json"), JSON.stringify(draft, null, 2));
  await writeFile(join(OUT, "email-draft.md"), `# Brouillon — ${subject}

**Aucun envoi sans OK Paula.**

- **To :** \`${pack.to.join("`, `")}\`
- **Cc :** ${(pack.cc.length ? "`" + pack.cc.join("`, `") + "`" : "—")}
- **Bcc :** \`${pack.bcc}\`
- **PJ :** \`${invoiceName}\`, \`${docxName}\`
- **Montant :** ${formatEuro(amountTtc)} TTC · échéance ${formatFr(pack.due_date)}
- **IBAN :** \`${FLI_BANK_DETAILS.iban}\` (…189 · checksum ${isValidIban(FLI_BANK_DETAILS.iban) ? "OK" : "KO"})
${checkoutUrl ? `- **Lien paiement :** ${checkoutUrl}` : ""}

\`\`\`
${bodyText}
\`\`\`
`);
  await writeFile(join(OUT, "email.html"), html);
  console.log(`Draft → ${join(OUT, "email-draft.md")}`);
  console.log(
    `SUMMARY ${pack.candidates.length} tests · ${formatEuro(amountHt)} HT · ${formatEuro(amountTtc)} TTC · ${pack.invoice_number}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

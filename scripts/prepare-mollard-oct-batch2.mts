/**
 * Lot Mollard/Tessier oct. batch 2 (8 candidats) — PDF ESF + factures Stripe + brouillons.
 * Aucun envoi Resend (dry-run uniquement).
 *
 *   ./node_modules/.bin/tsx scripts/prepare-mollard-oct-batch2.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
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

const OUT = "/opt/cursor/artifacts/mollard-oct-batch2";
const DATA = join(process.cwd(), "scripts/data/mollard-oct-batch2-evals.json");
const BCC = "info@fli.fr";

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
  pdf_habillage: "esf";
  send_mode: string;
  school_cc: string[];
  payment: string;
  stripe_charge?: string;
  stripe_pi?: string;
  payment_date?: string;
  invoice_number?: string;
  invoice_seq?: number;
  note?: string;
};

function slugName(name: string, language: string, key: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `evaluation-${base}-${language}-${key}.pdf`;
}

function buildBlocs(r: Row) {
  return {
    intro: r.intro,
    comp: [r.comp, r.grammar].filter(Boolean).join(" "),
    tech: [r.tech, r.points].filter(Boolean).join(" "),
    concl: r.concl,
  };
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

async function loadPublic(rel: string): Promise<Uint8Array | null> {
  try {
    return await readFile(join(process.cwd(), "public", rel));
  } catch {
    return null;
  }
}

function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

async function buildPaidInvoicePdf(opts: {
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentDate: string;
  languageLabel: string;
}): Promise<Uint8Array> {
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
  draw(`N° ${opts.invoiceNumber}`, left, y, { bold: true, size: 12 });
  draw(`Date : ${formatFr(opts.invoiceDate)}`, right - 140, y, { size: 10 });
  y -= 28;

  page.drawRectangle({
    x: left,
    y: y - 50,
    width: right - left,
    height: 58,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(opts.clientName, left + 12, y - 30, { bold: true, size: 11 });
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
  draw(`Test d'${opts.languageLabel}`, left, y, { size: 10 });
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
  draw(`Date : ${formatFr(opts.paymentDate)}`, left, y - 28, { size: 9 });
  draw("Moyen : Carte bancaire en ligne (Stripe)", left, y - 40, { size: 9 });
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

function emailBody(r: Row, withInvoice: boolean): string {
  const invoiceLine = withInvoice
    ? `\n\nLa facture acquittée n° ${r.invoice_number} est jointe.`
    : "";
  return `Bonjour,

veuillez trouver ci-joint le résultat de votre test d'anglais (${r.cecrl}).

Une copie est adressée à votre école de ski.${invoiceLine}

Cordialement,
FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr`;
}

function schoolOnlyBody(r: Row): string {
  return `Bonjour,

veuillez trouver ci-joint le résultat du test d'anglais de ${r.name} (${r.cecrl}).

Nous n'avons pas l'adresse e-mail du/de la candidat·e ; merci de lui transmettre ce document.

Cordialement,
FLI — France Langues International`;
}

async function main() {
  await mkdir(join(OUT, "pdfs"), { recursive: true });
  await mkdir(join(OUT, "invoices"), { recursive: true });
  const rows = JSON.parse(await readFile(DATA, "utf8")) as Row[];
  const assets = await loadAssets();
  const manifest: Array<Record<string, unknown>> = [];
  const draftLines: string[] = [
    "# Brouillons — lot Mollard/Tessier batch 2 (oct. 2026)",
    "",
    "**Aucun envoi sans OK Paula.** Dry-run uniquement.",
    "",
    "## Synthèse",
    "",
    "| Candidat | École | Niveau | Email | Paiement | Envoi prévu |",
    "|---|---|---|---|---|---|",
  ];

  for (const r of rows) {
    const blocs = buildBlocs(r);
    const [comp, expr, struct, tech, conv, gen] = r.scores;
    const evaluationId = randomUUID();
    const input: EvaluationPdfInput = {
      sponsorType: r.pdf_habillage,
      evaluatedAt: new Date(r.test_at),
      candidateName: r.name,
      candidateProfession: r.profession,
      skiDiscipline: "alpin",
      trainingCycle: "1",
      carteSyndicale: r.carte,
      language: "anglais",
      previousTest: false,
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
        introduction: blocs.intro,
        comprehension: blocs.comp,
        technique: blocs.tech,
        conclusion: blocs.concl,
      },
      noteMethodologique: null,
      priceTtc: 45,
      identity: IDENTITY,
      cecrlScale: SCALE,
      verifiedAt: new Date(),
    };
    const bytes = await renderEvaluationPdf(buildEvaluationPdfModel(input), assets);
    const pdfName = slugName(r.name, "anglais", r.key);
    await writeFile(join(OUT, "pdfs", pdfName), bytes);
    console.log(`PDF OK ${pdfName} (${bytes.length})`);

    let invoiceName: string | null = null;
    if (r.send_mode === "stripe_paid_invoice" && r.invoice_number && r.payment_date) {
      const invBytes = await buildPaidInvoicePdf({
        clientName: r.name,
        invoiceNumber: r.invoice_number,
        invoiceDate: r.test_at.slice(0, 10),
        paymentDate: r.payment_date,
        languageLabel: "anglais",
      });
      invoiceName = `Facture-${r.invoice_number}-${r.key}-acquittee.pdf`;
      await writeFile(join(OUT, "invoices", invoiceName), invBytes);
      console.log(`INV OK ${invoiceName} (${invBytes.length})`);
    }

    const to =
      r.email ??
      (r.school.includes("GERVAIS")
        ? "administration@esf-saintgervais.com"
        : r.school_cc[0]);
    const cc = r.email ? r.school_cc : r.school_cc.slice(1);
    const subject = r.email
      ? `Résultat de votre test de langue — ${r.name}`
      : `Résultat test de langue — ${r.name} (${r.school})`;
    const body = r.email ? emailBody(r, !!invoiceName) : schoolOnlyBody(r);
    const attachments = [pdfName, invoiceName].filter(Boolean) as string[];

    draftLines.push(
      `| ${r.name} | ${r.school} | ${r.cecrl} | ${r.email ?? "**MANQUANT**"} | ${r.payment}${r.stripe_charge ? ` · ${r.stripe_charge}` : ""} | ${r.email ? (invoiceName ? "TO candidat + facture" : "TO candidat · sans facture") : "TO école seule (pas d'email)"} |`
    );

    manifest.push({
      key: r.key,
      name: r.name,
      email: r.email,
      school: r.school,
      cecrl: r.cecrl,
      scores: r.scores,
      evaluation_id: evaluationId,
      pdf: pdfName,
      invoice: invoiceName,
      to,
      cc,
      bcc: BCC,
      subject,
      body,
      attachments,
      send_mode: r.send_mode,
      payment: r.payment,
      stripe_charge: r.stripe_charge ?? null,
      stripe_pi: r.stripe_pi ?? null,
      invoice_number: r.invoice_number ?? null,
      note: r.note ?? null,
      blocked: !r.email,
    });
  }

  draftLines.push("", "---", "");
  for (const m of manifest) {
    draftLines.push(`## ${m.name as string} — ${m.cecrl as string}`);
    draftLines.push("");
    if (m.blocked) {
      draftLines.push(`⚠️ **Email candidat manquant** — proposition : TO école \`${m.to as string}\`${(m.cc as string[]).length ? ` · CC \`${(m.cc as string[]).join("`, `")}\`` : ""}`);
    } else {
      draftLines.push(`- **To :** \`${m.to as string}\``);
      draftLines.push(`- **Cc :** \`${(m.cc as string[]).join("`, `")}\``);
    }
    draftLines.push(`- **Bcc :** \`${BCC}\``);
    draftLines.push(`- **Objet :** ${m.subject as string}`);
    draftLines.push(`- **PJ :** ${(m.attachments as string[]).join(", ")}`);
    if (m.stripe_charge) {
      draftLines.push(
        `- **Stripe :** \`${m.stripe_charge as string}\` / \`${m.stripe_pi as string}\` · facture \`${m.invoice_number as string}\``
      );
    }
    if (m.note) draftLines.push(`- **Note :** ${m.note as string}`);
    draftLines.push("");
    draftLines.push("```");
    draftLines.push(m.body as string);
    draftLines.push("```");
    draftLines.push("", "---", "");
  }

  await writeFile(join(OUT, "email-drafts.md"), draftLines.join("\n"));
  await writeFile(join(OUT, "manifest.json"), JSON.stringify({ count: manifest.length, items: manifest }, null, 2));
  console.log(`Drafts → ${join(OUT, "email-drafts.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

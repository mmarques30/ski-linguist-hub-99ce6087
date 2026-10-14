/**
 * Lot Mollard — envoi restant (hors Cesar impayé, Mandica hors lot, St Gervais + Lisa déjà partis).
 * TO candidat · CC 2 mails école · BCC info@fli.fr · PJ résultat + facture acquittée.
 *
 *   ./node_modules/.bin/tsx scripts/send-mollard-remaining-results.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-mollard-remaining-results.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const OUT_DIR = "/opt/cursor/artifacts/mollard-oct-2026/remaining-results";
const PDF_DIR = "/opt/cursor/artifacts/mollard-oct-2026/pdfs";
const INV_DIR = join(OUT_DIR, "invoices");
const BCC = "info@fli.fr";

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
  iban: "FR76 1820 6004 4339 5412 7300 144",
  bic: "AGRIFRPP882",
  activity: "82 73 01 366 73",
} as const;

type Row = {
  key: string;
  name: string;
  email: string;
  cecrl: string;
  school: string;
  cc: string[];
  resultPdf: string;
  bodyExtra?: string;
  subjectSuffix?: string;
  invoice?: {
    number: string;
    date: string;
    paymentDate: string;
    paymentMethodLabel: string;
  } | null;
};

const ROWS: Row[] = [
  {
    key: "montaine-1",
    name: "Montaine Gros-Deleglise",
    email: "deski.grosdeleglisemontaine@gmail.com",
    cecrl: "B1",
    school: "ESF CORBIER (LE)",
    cc: [], // Paula : moins bon → candidate seule
    resultPdf: "evaluation-Montaine-Gros-Deleglise-anglais-montaine-1.pdf",
    subjectSuffix: " du 08/10/2026",
    bodyExtra: " du 08 octobre",
    invoice: {
      number: "26-27.14328",
      date: "2026-10-08",
      paymentDate: "2026-09-23",
      paymentMethodLabel: "Virement",
    },
  },
  {
    key: "montaine-2",
    name: "Montaine Gros-Deleglise",
    email: "deski.grosdeleglisemontaine@gmail.com",
    cecrl: "B2",
    school: "ESF CORBIER (LE)",
    cc: ["info@esf-lecorbier.com", "direction@esf-lecorbier.com"],
    resultPdf: "evaluation-Montaine-Gros-Deleglise-anglais-montaine-2.pdf",
    invoice: {
      number: "26-27.14329",
      date: "2026-10-12",
      paymentDate: "2026-10-12",
      paymentMethodLabel: "Virement",
    },
  },
  {
    key: "maelys-pietri",
    name: "Maelys Pietri",
    email: "maelys.pietri@gmail.com",
    cecrl: "B2",
    school: "ESF ALPE D'HUEZ (L')",
    cc: ["info@esf-alpedhuez.com", "direction@esf-alpedhuez.com"],
    resultPdf: "evaluation-Maelys-Pietri-anglais-maelys-pietri.pdf",
    bodyExtra: " — barème Alpe d'Huez /20",
    invoice: {
      number: "26-27.14330",
      date: "2026-10-08",
      paymentDate: "2026-09-21",
      paymentMethodLabel: "Carte bancaire en ligne",
    },
  },
  {
    key: "leo-lamon",
    name: "Léo Lamon",
    email: "leolamon5@gmail.com",
    cecrl: "B1",
    school: "ESF Courchevel 1550",
    cc: ["contact@esf-courchevel.com", "direction@esf-courchevel.com"],
    resultPdf: "evaluation-Leo-Lamon-anglais-leo-lamon.pdf",
    invoice: {
      number: "26-27.14331",
      date: "2026-10-08",
      paymentDate: "2026-09-28",
      paymentMethodLabel: "Carte bancaire en ligne",
    },
  },
  {
    key: "charlotte-pautot",
    name: "Charlotte Pautot",
    email: "charlottepautot@gmail.com",
    cecrl: "B1",
    school: "ESF COURCHEVEL 1650",
    cc: ["vente@esfcourchevel1650.com", "direction@esfcourchevel1650.com"],
    resultPdf: "evaluation-Charlotte-Pautot-anglais-charlotte-pautot.pdf",
    invoice: {
      number: "26-27.14332",
      date: "2026-10-08",
      paymentDate: "2026-10-02",
      paymentMethodLabel: "Virement",
    },
  },
  {
    key: "chloe-merloz",
    name: "Chloé Merloz",
    email: "cloeski@gmail.com",
    cecrl: "B1+",
    school: "ESF Courchevel 1550",
    cc: ["contact@esf-courchevel.com", "direction@esf-courchevel.com"],
    resultPdf: "evaluation-Chloe-Merloz-anglais-chloe-merloz.pdf",
    invoice: {
      number: "26-27.14333",
      date: "2026-10-08",
      paymentDate: "2026-10-06",
      paymentMethodLabel: "Carte bancaire en ligne",
    },
  },
  {
    key: "gregoire-roulleaux",
    name: "Grégoire Roulleaux",
    email: "roulleauxgregoire@gmail.com",
    cecrl: "B1",
    school: "ESF FLAINE",
    cc: ["info@esf-flaine.fr", "direction@esf-flaine.fr"],
    resultPdf: "evaluation-Gregoire-Roulleaux-anglais-gregoire-roulleaux.pdf",
    invoice: {
      number: "26-27.14334",
      date: "2026-10-12",
      paymentDate: "2026-10-06",
      paymentMethodLabel: "Carte bancaire en ligne",
    },
  },
  {
    key: "pierre-bujard",
    name: "Pierre Bujard",
    email: "bujard.pierre@orange.fr",
    cecrl: "A2+",
    school: "ESF ARACHES LES CARROZ",
    cc: ["admin@esf-lescarroz.com", "directeur@esf-lescarroz.com"],
    resultPdf: "evaluation-Pierre-Bujard-anglais-pierre-bujard.pdf",
    invoice: null, // facture école groupée 14327 déjà envoyée à l'ESF
  },
  {
    key: "sasha-gonin",
    name: "Sasha Gonin-Porquez",
    email: "goninporquezsasha@gmail.com",
    cecrl: "B1",
    school: "ESF COURCHEVEL 1850",
    cc: ["ski@esfcourchevel.com", "sebdame@esfcourchevel.com"],
    resultPdf: "evaluation-Sasha-Gonin-Porquez-anglais-sasha-gonin.pdf",
    invoice: {
      number: "26-27.14301",
      date: "2026-09-14",
      paymentDate: "2026-09-03",
      paymentMethodLabel: "Virement",
    },
  },
];

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

async function buildPaidTestInvoicePdf(input: {
  invoiceNumber: string;
  invoiceDate: string;
  paymentDate: string;
  paymentMethodLabel: string;
  clientName: string;
}): Promise<Uint8Array> {
  const amountHt = 37.5;
  const tvaRate = 20;
  const amountTtc = 45;
  const tvaAmount = (amountHt * tvaRate) / 100;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { font, fontBold } = await embedFonts(doc);
  const left = 48;
  const right = 595.28 - 48;
  let y = 841.89 - 48;

  const draw = (
    text: string,
    x: number,
    baseline: number,
    opts?: { bold?: boolean; size?: number; color?: typeof INK }
  ) => {
    page.drawText(text, {
      x,
      y: baseline,
      size: opts?.size ?? 10,
      font: opts?.bold ? fontBold : font,
      color: opts?.color ?? INK,
    });
  };

  const logoBytes = await loadPublic(
    "inscription-documents/fli-invoice-logo.png"
  );
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
  }

  const headerTop = 841.89 - 52;
  draw("FACTURE - Test de niveau", right - 200, headerTop - 4, {
    bold: true,
    size: 14,
    color: YELLOW,
  });
  draw(`N°: ${input.invoiceNumber}`, right - 140, headerTop - 24, {
    bold: true,
    size: 10,
  });
  draw(`Date: ${formatFr(input.invoiceDate)}`, right - 140, headerTop - 38, {
    size: 9,
    color: MUTED,
  });

  for (const line of [
    FLI.name,
    FLI.address,
    FLI.city,
    `Tél: ${FLI.phone}`,
    FLI.email,
  ]) {
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
    y: y - 50,
    width: right - left,
    height: 58,
    color: rgb(0.96, 0.96, 0.96),
  });
  draw("CLIENT", left + 12, y - 14, { size: 8, color: MUTED, bold: true });
  draw(input.clientName, left + 12, y - 30, { bold: true, size: 11 });
  y -= 76;

  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 2,
    color: YELLOW,
  });
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
  draw("Test d'anglais", left, y, { size: 10 });
  draw("1", left + 290, y, { size: 10 });
  draw(formatEuro(amountHt), left + 330, y, { size: 10 });
  const tot = formatEuro(amountHt);
  draw(tot, right - fontBold.widthOfTextAtSize(tot, 10), y, {
    bold: true,
    size: 10,
  });
  y -= 36;

  const boxX = right - 220;
  const row = (
    label: string,
    value: string,
    opts?: { bold?: boolean; color?: typeof INK; size?: number }
  ) => {
    draw(label, boxX, y, {
      size: opts?.size ?? 10,
      bold: opts?.bold,
      color: opts?.color ?? MUTED,
    });
    const vw = (opts?.bold ? fontBold : font).widthOfTextAtSize(
      value,
      opts?.size ?? 10
    );
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
  row("Total TTC", formatEuro(amountTtc), {
    bold: true,
    color: YELLOW,
    size: 12,
  });
  row("Net à payer", formatEuro(0), { bold: true, color: GREEN, size: 12 });

  const stampBytes = await loadPublic(
    "inscription-documents/facture-acquittee-stamp.png"
  );
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
  draw("Facture acquittée", left, y - 14, {
    bold: true,
    size: 11,
    color: GREEN,
  });
  draw(`Date : ${formatFr(input.paymentDate)}`, left, y - 28, { size: 9 });
  draw(`Moyen : ${input.paymentMethodLabel}`, left, y - 40, { size: 9 });
  draw(`SIRET: ${FLI.siret}`, right - 160, y - 14, { size: 9, color: MUTED });
  draw(`N° TVA: ${FLI.tvaNumber}`, right - 160, y - 28, {
    size: 9,
    color: MUTED,
  });

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

function emailHtml(row: Row): string {
  const schoolLine =
    row.cc.length > 0
      ? `<p style="margin:0 0 16px">Une copie est adressée à votre école de ski.</p>`
      : "";
  const invoiceLine = row.invoice
    ? `<p style="margin:0 0 16px">La facture acquittée n°&nbsp;${row.invoice.number} est jointe.</p>`
    : `<p style="margin:0 0 16px">La facture a été adressée à votre école de ski.</p>`;

  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'anglais${row.bodyExtra ?? ""} (${row.cecrl}).</p>
${schoolLine}
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
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(INV_DIR, { recursive: true });

  const results: Array<Record<string, unknown>> = [];

  for (const row of ROWS) {
    const resultBytes = await readFile(join(PDF_DIR, row.resultPdf));
    const attachments: Array<{ filename: string; content: string }> = [
      {
        filename: row.resultPdf,
        content: Buffer.from(resultBytes).toString("base64"),
      },
    ];

    let invoiceFilename: string | null = null;
    if (row.invoice) {
      const invBytes = await buildPaidTestInvoicePdf({
        invoiceNumber: row.invoice.number,
        invoiceDate: row.invoice.date,
        paymentDate: row.invoice.paymentDate,
        paymentMethodLabel: row.invoice.paymentMethodLabel,
        clientName: row.name,
      });
      invoiceFilename = `Facture-${row.invoice.number}.pdf`;
      await writeFile(join(INV_DIR, invoiceFilename), invBytes);
      attachments.push({
        filename: invoiceFilename,
        content: Buffer.from(invBytes).toString("base64"),
      });
    }

    const subject = `Résultat de votre test de langue${row.subjectSuffix ?? ""} — ${row.name}`;
    const draft = {
      key: row.key,
      to: row.email,
      cc: row.cc,
      bcc: BCC,
      subject,
      school: row.school,
      cecrl: row.cecrl,
      attachments: attachments.map((a) => a.filename),
      invoice_number: row.invoice?.number ?? null,
      dry_run: !doSend,
      prepared_at: new Date().toISOString(),
      excluded_note:
        row.key === "pierre-bujard"
          ? "facture école 26-27.14327 déjà envoyée"
          : null,
    };
    await writeFile(
      join(OUT_DIR, `${row.key}-draft.json`),
      JSON.stringify(draft, null, 2)
    );

    if (!doSend) {
      console.log(
        `DRY ${row.key} → ${row.email} cc=${row.cc.join(",") || "—"} inv=${row.invoice?.number ?? "école"}`
      );
      results.push(draft);
      continue;
    }
    if (!apiKey) throw new Error("RESEND_API_KEY absente");

    const body: Record<string, unknown> = {
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [row.email],
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject,
      html: emailHtml(row),
      attachments,
    };
    if (row.cc.length) body.cc = row.cc;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/mollard-remaining-results",
      },
      body: JSON.stringify(body),
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
      invoice_pdf: invoiceFilename,
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
        excluded: [
          "cesar-maxence (impayé)",
          "steven-mandica (hors lot)",
          "lisa-roch + st-gervais (déjà envoyés)",
        ],
        count: results.length,
        dry_run: !doSend,
        results,
      },
      null,
      2
    )
  );

  const md = [
    `# Restant Mollard — résultats + factures`,
    ``,
    `- Exclus : Cesar (impayé), Mandica (hors lot), Lisa + St Gervais (déjà envoyés)`,
    `- Mode : ${doSend ? "ENVOYÉ" : "dry-run"}`,
    ``,
    ...results.map((r) => {
      const id = (r.resend_id as string) || "—";
      const cc = Array.isArray(r.cc) ? (r.cc as string[]).join(", ") : "—";
      return `- **${r.key}** → \`${r.to}\` · CC ${cc || "—"} · inv ${r.invoice_number ?? "école"} · \`${id}\``;
    }),
    ``,
  ].join("\n");
  await writeFile(join(OUT_DIR, "summary.md"), md);

  if (!doSend) console.log("Dry-run OK — relancer avec SEND=1.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

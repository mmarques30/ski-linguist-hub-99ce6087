/**
 * ESF Saint-Gervais — tests italien 13/10/2026 (Nathalie Raguin).
 * Eliane Jeanbourquin + Louise Labrousse.
 * PDF = habillage ESF (C.5) · appréciation générale arrondie au demi-point.
 * TO candidat · CC administration@esf-saintgervais.com · BCC info@fli.fr · sans facture.
 *
 *   ./node_modules/.bin/tsx scripts/send-st-gervais-italien-1310.mts
 *   SEND=1 ./node_modules/.bin/tsx scripts/send-st-gervais-italien-1310.mts
 *
 * Eliane : TO école seule (pas d'e-mail candidat — validé Paula 20/10).
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

const OUT = "/opt/cursor/artifacts/st-gervais-italien-1310";
const BCC = "info@fli.fr";
const SCHOOL_CC = ["administration@esf-saintgervais.com"];

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

/** Arrondi au demi-point le plus proche (0,5 → vers le haut). */
function roundHalf(score: number): number {
  return Math.round(score * 2) / 2;
}

function cecrlFromScore(score: number): string {
  const row = SCALE.find((r) => r.score === score);
  return row?.cecrl_label ?? "—";
}

type Row = {
  key: string;
  name: string;
  /** Destinataire principal (candidat ou école). */
  to: string[];
  cc: string[];
  /** school = corps adressé à l'ESF ; candidate = corps candidat. */
  audience: "school" | "candidate";
  carteSyndicale: string | null;
  scores: {
    comprehension: number;
    expression: number;
    structure: number;
    technique: number;
    conversation: number;
    generalRaw: number;
  };
  blocs: {
    introduction: string;
    comprehension: string;
    technique: string;
    conclusion: string;
  };
  pdfOut: string;
  note?: string;
};

const ROWS: Row[] = [
  {
    key: "eliane-jeanbourquin",
    name: "Eliane Jeanbourquin",
    // Paula 20/10 : pas d'e-mail candidat → envoi école uniquement
    to: ["administration@esf-saintgervais.com"],
    cc: [],
    audience: "school",
    carteSyndicale: "2374",
    scores: {
      comprehension: 3,
      expression: 3.5,
      structure: 3,
      technique: 3.5,
      conversation: 3,
      generalRaw: 3.25,
    },
    blocs: {
      introduction:
        "Vous vous exprimez facilement mais êtes gênée par des erreurs grammaticales et syntaxiques. Vos phrases sont souvent courtes. Votre prononciation et votre accent sont corrects dans l'ensemble mais vous manquez de pratique. La fin des mots est souvent hésitante et inexacte : singulier / pluriel ; masculin / féminin ; accords des verbes… « sono nato » à la place de « sono nata » ; « le fragola » au lieu de « le fragole » ; « lo nome » à la place de « il nome »… Le vocabulaire spécifique est connu et vous arrivez à vous faire comprendre et à interagir. Vous avez suffisamment de vocabulaire pour converser simplement.",
      comprehension:
        "Vous avez une écoute globale mais avez du mal à retenir les détails. Concernant le texte audio, vous avez compris de quoi ça parlait mais n'avez pas retenu précisément les informations. Vous peinez à saisir le sens des propos quand le débit est un peu rapide. N'hésitez pas à regarder des films en VO régulièrement pour habituer votre oreille.",
      technique: "",
      conclusion:
        "Vous vous débrouillez globalement pour faire passer les informations importantes et pour échanger simplement. Votre vocabulaire spécifique est suffisant pour que l'on comprenne les consignes. Revoyez les règles grammaticales de base afin d'affiner votre discours. Demandez à vos connaissances italiennes de vous corriger quand une erreur est récurrente.",
    },
    pdfOut: "evaluation-Eliane-Jeanbourquin-italien.pdf",
    note: "Générale 3,25→3,5 B2+. Envoi école seule (pas d'e-mail candidat).",
  },
  {
    key: "louise-labrousse",
    name: "Louise Labrousse",
    to: ["louise.labrousse@gmail.com"],
    cc: ["administration@esf-saintgervais.com"],
    audience: "candidate",
    carteSyndicale: null,
    scores: {
      comprehension: 3.5,
      expression: 2.5,
      structure: 2.5,
      technique: 2,
      conversation: 3,
      generalRaw: 2.75,
    },
    blocs: {
      introduction:
        "Vous avez envie de vous exprimer et c'est bien. Néanmoins, vous faites de nombreuses erreurs grammaticales et syntaxiques : « i personi che lavorare » au lieu de « le persone che lavorano ». Vous cherchez vos mots et cela vous empêche d'avoir une fluidité dans votre discours. Attention également à votre conjugaison. Vous confondez premières personnes du singulier et du pluriel : « abbiamo » à la place de « ho ». Plus on avance dans l'entretien et plus il semble difficile pour vous de soutenir la discussion. Vos mots sont tronqués, vos accords approximatifs : « le lezione » au lieu de « le lezioni ». Vous avez tendance à paniquer un peu dès qu'on vous pose des questions. Il faut prendre confiance en vous ! Le vocabulaire technique n'est pas complètement maîtrisé, il faudrait pratiquer davantage.",
      comprehension:
        "Vous avez bien compris le texte audio et avez répondu favorablement aux questions posées. Vous avez donc une écoute efficace quand vous vous concentrez. C'est un très bon point ! Je vous suggère de passer plus de temps avec vos amis italiens et de participer davantage aux conversations.",
      technique: "",
      conclusion:
        "Vous vous débrouillez globalement assez bien pour qu'on vous comprenne mais pas suffisamment pour tenir une conversation un peu trop longue ou détaillée. Puisque vous avez la chance de vous trouver en Italie pour quelques mois, profitez de vous trouver en immersion totale le plus souvent possible !",
    },
    pdfOut: "evaluation-Louise-Labrousse-italien.pdf",
    note: "Générale 2,75→3 B2. TO candidat + CC école.",
  },
];

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

function emailHtml(row: Row, cecrl: string): string {
  const body =
    row.audience === "school"
      ? `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat du test d'italien de <strong>${row.name}</strong> (${cecrl}), passé le 13/10/2026.</p>
<p style="margin:0 0 16px">Nous n'avons pas l'adresse e-mail de la candidate : merci de lui transmettre ce compte-rendu.</p>
<p style="margin:0 0 4px">Cordialement,</p>`
      : `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test d'italien (${cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski (ESF Saint-Gervais).</p>
<p style="margin:0 0 4px">Cordialement,</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
${body}
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
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT, { recursive: true });
  const assets = await loadAssets();
  const results: Array<Record<string, unknown>> = [];
  const tableRows: string[] = [];

  for (const row of ROWS) {
    const general = roundHalf(row.scores.generalRaw);
    const cecrl = cecrlFromScore(general);

    const input: EvaluationPdfInput = {
      sponsorType: "esf",
      evaluatedAt: new Date("2026-10-13T10:00:00+02:00"),
      candidateName: row.name,
      candidateProfession: "moniteur",
      skiDiscipline: "alpin",
      trainingCycle: null,
      carteSyndicale: row.carteSyndicale,
      language: "italien",
      previousTest: false,
      skiSchoolName: "ESF SAINT GERVAIS",
      companyName: "ESF SAINT GERVAIS",
      instructorName: "Nathalie Raguin",
      scores: {
        comprehension: row.scores.comprehension,
        expression: row.scores.expression,
        structure: row.scores.structure,
        technique: row.scores.technique,
        conversation: row.scores.conversation,
        general,
      },
      cecrlGeneral: cecrl,
      blocs: row.blocs,
      noteMethodologique: null,
      priceTtc: 45,
      identity: IDENTITY,
      cecrlScale: SCALE,
      verifiedAt: new Date("2026-10-20T12:00:00+02:00"),
    };

    const model = buildEvaluationPdfModel(input);
    const bytes = await renderEvaluationPdf(model, assets);
    const dest = join(OUT, row.pdfOut);
    await writeFile(dest, bytes);

    const subject =
      row.audience === "school"
        ? `Résultat test italien — ${row.name} (ESF Saint-Gervais)`
        : `Résultat de votre test de langue — ${row.name}`;
    const draft = {
      key: row.key,
      to: row.to,
      cc: row.cc,
      bcc: BCC,
      audience: row.audience,
      subject,
      attachment: row.pdfOut,
      cecrl,
      score_general_raw: row.scores.generalRaw,
      score_general_rounded: general,
      language: "italien",
      test_date: "13/10/2026",
      evaluator: "Nathalie Raguin",
      school: "ESF SAINT GERVAIS",
      habillage: "esf",
      no_invoice: true,
      note: row.note ?? null,
      dry_run: !doSend,
      prepared_at: new Date().toISOString(),
      pdf_bytes: bytes.length,
    };
    await writeFile(join(OUT, `${row.key}-draft.json`), JSON.stringify(draft, null, 2));
    tableRows.push(
      `| ${row.name} | ${row.to.join(", ")}${row.cc.length ? ` (CC ${row.cc.join(", ")})` : ""} | ${cecrl} (${String(general).replace(".", ",")} ; brute ${String(row.scores.generalRaw).replace(".", ",")}) | \`${row.pdfOut}\` |`
    );

    if (!doSend) {
      console.log(
        `DRY ${row.key} → ${row.to.join(",")} cc=${row.cc.join(",") || "—"} générale ${row.scores.generalRaw}→${general} ${cecrl} (${bytes.length} o)`
      );
      results.push(draft);
      continue;
    }
    if (!apiKey) throw new Error("RESEND_API_KEY absente");

    const payload: Record<string, unknown> = {
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: row.to,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject,
      html: emailHtml(row, cecrl),
      attachments: [
        {
          filename: row.pdfOut,
          content: Buffer.from(bytes).toString("base64"),
        },
      ],
    };
    if (row.cc.length > 0) payload.cc = row.cc;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "FLI-Formation/st-gervais-italien-1310",
      },
      body: JSON.stringify(payload),
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

  await writeFile(
    join(OUT, "summary.json"),
    JSON.stringify(
      {
        school: "ESF SAINT GERVAIS",
        language: "italien",
        test_date: "13/10/2026",
        evaluator: "Nathalie Raguin",
        habillage: "esf",
        general_rounding: "Math.round(x*2)/2",
        count: results.length,
        dry_run: !doSend,
        no_invoice: true,
        cc: SCHOOL_CC,
        bcc: BCC,
        results,
      },
      null,
      2
    )
  );

  await writeFile(
    join(OUT, "email-draft.md"),
    `# Brouillon — ESF Saint-Gervais italien 13/10/2026 — **À VALIDER — PAS ENVOYÉ**

Évaluatrice : Nathalie Raguin · Habillage : **ESF (C.5)** · Générale **arrondie au demi-point** · CC : \`${SCHOOL_CC.join("`, `")}\` · BCC : \`${BCC}\` · **sans facture**.

| Candidat | E-mail | Niveau | PJ |
|----------|--------|--------|-----|
${tableRows.join("\n")}

## Corps

Bonjour,

veuillez trouver ci-joint le résultat de votre test d'italien ([niveau]).

Une copie est adressée à votre école de ski (ESF Saint-Gervais).

Cordialement,
FLI — France Langues International

## Arrondi
- Eliane : 3,25 → **3,5 (B2+)**
- Louise : 2,75 → **3 (B2)**
`
  );
  console.log(`SUMMARY ${join(OUT, "summary.json")} dry_run=${!doSend}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

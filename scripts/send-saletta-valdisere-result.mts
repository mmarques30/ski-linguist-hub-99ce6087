/**
 * Résultat Mattia Saletta — ESF Val d'Isère — portugais brésilien — 08/10/2026 (Paula).
 * TO candidat · CC contact + direction école · BCC info@fli.fr · PJ résultat (pas de facture).
 *
 *   ./node_modules/.bin/tsx scripts/send-saletta-valdisere-result.mts
 *   SEND=1 CANDIDATE_EMAIL=… ./node_modules/.bin/tsx scripts/send-saletta-valdisere-result.mts
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

const OUT = "/opt/cursor/artifacts/mollard-oct-2026/saletta-valdisere";
const BCC = "info@fli.fr";
const SCHOOL_CC = ["contact@esfvaldisere.com", "direction@esfvaldisere.com"];
const PDF_NAME = "evaluation-Mattia-Saletta-portugais-valdisere.pdf";

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

/** Texte Paula — coquilles mineures corrigées pour le CR officiel. */
const BLOCS = {
  introduction:
    "Grâce à vos connaissances de diverses langues latines et votre intérêt pour le portugais brésilien, vous arrivez très bien à communiquer. Vous êtes capable d'aborder différents sujets, de vous faire comprendre quand il vous manque du vocabulaire. Bravo !",
  comprehension:
    "Le seul point à améliorer, c'est vraiment les structures de la langue, la grammaire, la conjugaison des verbes dans les différents temps et les accords masculin / féminin. Parfois vous mélangez un peu d'espagnol, un peu d'italien, un peu de français, et vous arrivez à vous faire comprendre.",
  technique:
    "Quelques exemples pendant votre test : pour les enfants, on dit crianças, meninos/meninas pour les enfants en général et filho/filha pour nos enfants. Alba, c'est votre « filha » et pas « niña ». Il faudrait réviser les verbes et leurs conjugaisons : « je sais » se dit « eu sei » et pas « eu sabo ». Révisez bien le vocabulaire du ski aussi : même si on vous comprend, les mots précis peuvent vous aider.",
  conclusion:
    "Continuez à discuter avec les Brésiliens et essayez de regarder des émissions / podcasts. Je vous conseille une chaîne YouTube (humoristique) qui s'appelle Porta dos Fundos : essayez de regarder une vidéo par jour, ça va vous aider à progresser.",
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

function emailHtml(name: string, cecrl: string): string {
  const body = `
<p style="margin:0 0 16px">Bonjour,</p>
<p style="margin:0 0 16px">veuillez trouver ci-joint le résultat de votre test de portugais brésilien (${cecrl}).</p>
<p style="margin:0 0 16px">Une copie est adressée à votre école de ski (ESF Val d'Isère).</p>
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
  const candidateEmail = (process.env.CANDIDATE_EMAIL || "").trim();
  await mkdir(OUT, { recursive: true });

  const input: EvaluationPdfInput = {
    sponsorType: "esf",
    evaluatedAt: new Date("2026-10-08T10:00:00+02:00"),
    candidateName: "Mattia Saletta",
    candidateProfession: "moniteur",
    skiDiscipline: "alpin",
    trainingCycle: null,
    carteSyndicale: null,
    language: "portugais",
    previousTest: false,
    skiSchoolName: "ESF VAL D ISERE",
    companyName: "ESF VAL D ISERE",
    instructorName: "Paula Rangel-Halbwachs",
    scores: {
      comprehension: 3,
      expression: 3,
      structure: 2,
      technique: 3,
      conversation: 3,
      general: 3,
    },
    cecrlGeneral: "B2",
    blocs: BLOCS,
    noteMethodologique: null,
    priceTtc: 45,
    identity: IDENTITY,
    cecrlScale: SCALE,
    verifiedAt: new Date("2026-10-14T14:00:00+02:00"),
  };

  const assets = await loadAssets();
  const model = buildEvaluationPdfModel(input);
  const bytes = await renderEvaluationPdf(model, assets);
  const pdfPath = join(OUT, PDF_NAME);
  await writeFile(pdfPath, bytes);

  const subject = "Résultat de votre test de langue — Mattia Saletta";
  const draft = {
    send: false,
    awaiting_paula_validation: true,
    missing_candidate_email: !candidateEmail,
    to: candidateEmail || null,
    cc: SCHOOL_CC,
    bcc: BCC,
    subject,
    cecrl: "B2",
    school: "ESF VAL D ISERE",
    language: "portugais",
    test_date: "08/10/2026",
    evaluator: "Paula Rangel-Halbwachs",
    scores: {
      comprehension: "3 - B2",
      expression: "3 - B2",
      structure: "2 - B1",
      technique: "3 - B2",
      conversation: "3 - B2",
      general: "3 - B2",
    },
    attachment: PDF_NAME,
    pdf_bytes: bytes.length,
    no_invoice: true,
    prepared_at: new Date().toISOString(),
  };

  await writeFile(join(OUT, "email-draft.json"), JSON.stringify(draft, null, 2));
  await writeFile(
    join(OUT, "email-draft.md"),
    `# Brouillon — Mattia Saletta (ESF Val d'Isère) — **À VALIDER — PAS ENVOYÉ**

- **À :** ${candidateEmail || "⚠️ MANQUANT — indiquer CANDIDATE_EMAIL"}
- **CC :** ${SCHOOL_CC.join(", ")}
- **BCC :** ${BCC}
- **Objet :** ${subject}
- **Niveau :** B2 (appréciation générale 3)
- **PJ :** \`${PDF_NAME}\` (${bytes.length} o) — pas de facture

## Corps

Bonjour,

veuillez trouver ci-joint le résultat de votre test de portugais brésilien (B2).

Une copie est adressée à votre école de ski (ESF Val d'Isère).

Cordialement,
FLI — France Langues International
`
  );

  console.log(`PDF ${pdfPath} (${bytes.length} o)`);
  console.log(`DRAFT ${join(OUT, "email-draft.md")}`);

  if (!doSend) {
    console.log("DRY_RUN — aucun envoi. Relancer avec SEND=1 CANDIDATE_EMAIL=… après OK Paula.");
    return;
  }
  if (!candidateEmail) {
    throw new Error("CANDIDATE_EMAIL obligatoire pour l'envoi");
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "FLI-Formation/saletta-valdisere-result",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [candidateEmail],
      cc: SCHOOL_CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject,
      html: emailHtml("Mattia Saletta", "B2"),
      attachments: [
        {
          filename: PDF_NAME,
          content: Buffer.from(bytes).toString("base64"),
        },
      ],
    }),
  });
  const text = await response.text();
  await writeFile(join(OUT, "resend.json"), text);
  if (!response.ok) throw new Error(`Resend ${response.status}: ${text}`);
  let resendId: string | null = null;
  try {
    resendId = JSON.parse(text)?.id ?? null;
  } catch {
    /* ignore */
  }
  draft.send = true;
  draft.awaiting_paula_validation = false;
  (draft as Record<string, unknown>).resend_id = resendId;
  (draft as Record<string, unknown>).sent_at = new Date().toISOString();
  await writeFile(join(OUT, "email-draft.json"), JSON.stringify(draft, null, 2));
  console.log(`ENVOYE ${resendId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

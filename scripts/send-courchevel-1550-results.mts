/**
 * Envoi one-shot : résultats tests ESF Courchevel 1550 → Stéphanie (+ Lucas en CC).
 * Usage :
 *   npx tsx scripts/send-courchevel-1550-results.mts           # dry-run (génère PDF)
 *   SEND=1 npx tsx scripts/send-courchevel-1550-results.mts    # envoi Resend réel
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

const OUT_DIR = "/opt/cursor/artifacts/courchevel-1550-results";
const TO = "contact@esf-courchevel.com";
const CC = ["direction@esf-courchevel.com"];
const BCC = "info@fli.fr";
const SUBJECT =
  "Résultats des tests de langue — ESF Courchevel 1550";

const IDENTITY: FliIdentity = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
};

const SCALE: CecrlScaleRow[] = [
  { score: 0, cecrl_label: "A1", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Éveil" },
  { score: 0.5, cecrl_label: "A1+", base_label: "A1", niveau: 0, description: "Faux débutant / Quelques notions / Éveil" },
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

type EvalRow = {
  evaluation_id: string;
  candidate_name: string;
  language: string;
  datetime: string;
  previous_test: boolean;
  sponsor_type: string;
  profession: string | null;
  carte_syndicale: string | null;
  ski_discipline: string | null;
  training_cycle: string | null;
  ski_school_name: string | null;
  instructor_first_name: string | null;
  instructor_last_name: string | null;
  score_comprehension: string;
  score_expression: string;
  score_structure: string;
  score_technique: string;
  score_conversation: string;
  score_general: string;
  cecrl_label: string;
  bloc_introduction: string | null;
  bloc_comprehension: string | null;
  bloc_technique: string | null;
  bloc_conclusion: string | null;
  note_methodologique: string | null;
  verified_at: string | null;
};

const ROWS: EvalRow[] = [
  {
    evaluation_id: "95502ad8-8b54-495d-9c2b-e2bfbe99a4ce",
    candidate_name: "Alexandre Touche",
    language: "anglais",
    datetime: "2026-09-24 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: null,
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "5",
    score_expression: "5",
    score_structure: "5",
    score_technique: "5",
    score_conversation: "5",
    score_general: "5",
    cecrl_label: "C2",
    bloc_introduction: "Anglais bilingue natif.",
    bloc_comprehension: null,
    bloc_technique:
      "Maintenez ce niveau de maîtrise. Le C2 (Niveau 5 — Maîtrise) correspond à une maîtrise proche du bilingue dans tous les contextes.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique: null,
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "6eddf640-69ff-4473-90f2-5eb6ebd7a898",
    candidate_name: "Arthur Queiros",
    language: "anglais",
    datetime: "2026-09-30 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: null,
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "4",
    score_expression: "3.5",
    score_structure: "3.5",
    score_technique: "4.5",
    score_conversation: "3.5",
    score_general: "4",
    cecrl_label: "C1",
    bloc_introduction:
      "Très bien, surtout les explications techniques très détaillées. Échanges fluides et spontanés. Grammaire : très bien.",
    bloc_comprehension:
      "Continuez à approfondir le vocabulaire pour enrichir encore la conversation générale. Prononciation : insistez sur l'accent tonique et étudiez les différentes prononciations des voyelles. Grammaire : allez plus en profondeur dans les subtilités des temps si vous souhaitez encore progresser.",
    bloc_technique:
      "Consolidez le C1 et amorcez le C2 en enrichissant encore le vocabulaire de conversation et la précision phonétique. Le C2 (Niveau 5 — Maîtrise) correspond à une maîtrise proche du bilingue dans tous les contextes.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique: null,
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "193798e7-e891-49a5-b00c-c87bccaa604b",
    candidate_name: "Arthur Queiros",
    language: "portugais",
    datetime: "2026-09-21 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: null,
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Paula",
    instructor_last_name: "Rangel-Halbwachs",
    score_comprehension: "4.5",
    score_expression: "4.5",
    score_structure: "4",
    score_technique: "4.5",
    score_conversation: "4.5",
    score_general: "4.5",
    cecrl_label: "C1+",
    bloc_introduction:
      "Vous parlez très bien le portugais grâce à vos origines et à vos séjours au Portugal et au Brésil. Accent clair ; conversation très fluide et agréable. Vous abordez tranquillement tous les sujets.",
    bloc_comprehension:
      "Quelques détails : verbe viver au passé — « eu vivi » (et non « eu vivei ») ; au Brésil, hanches = « quadril / quadris » ; talon = « calcanhar ». Vocabulaire encore à enrichir sur certains mots.",
    bloc_technique:
      "Même s'il vous manque quelques mots de vocabulaire, vous avez tous les outils linguistiques pour vous faire comprendre. Enrichissez encore le lexique pour consolider le C1+ et amorcer le C2. Le C2 (Niveau 5 — Maîtrise) correspond à une maîtrise proche du bilingue dans tous les contextes.",
    bloc_conclusion: "Bravo, et bonne continuation !",
    note_methodologique:
      "Structures à C1 (pas C1+), c'est ce qui tire la moyenne : point prioritaire.",
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "a02723cd-61fb-4840-9e8d-c205a4165c4e",
    candidate_name: "Carla Di Emanuele",
    language: "anglais",
    datetime: "2026-09-23 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: null,
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "2.5",
    score_expression: "2",
    score_structure: "1",
    score_technique: "2",
    score_conversation: "2",
    score_general: "2",
    cecrl_label: "B1",
    bloc_introduction:
      "De bons éléments dans la partie technique. Prononciation plutôt bonne. Compréhension orale : bien dans l'exercice.",
    bloc_comprehension:
      "Technique à consolider (sled / hike, et phrases maladroites du type : « push your outside knees in the downhill of the slope »…). Prononciation : attention à UP, KNEE, POLE. Compréhension : moins fluide dans l'échange. Grammaire à consolider : to vs for + verbe à l'infinitif, modaux (must, should, could), le passé, les -s à la troisième personne du singulier. Le niveau reste encore un peu juste en structure de la langue.",
    bloc_technique:
      "Priorisez les structures de la langue et la grammaire, puis consolidez le vocabulaire technique et la fluidité de l'échange. Le B2 (Niveau 3 — Post-intermédiaire / Opérationnel) demande d'être opérationnel·le dans les situations professionnelles de votre métier.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique:
      "Structures à A2, c'est ce qui tire la moyenne : point prioritaire.",
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "7010996f-7d99-4945-aec3-2b796db0fc6c",
    candidate_name: "Finn Carmichael",
    language: "anglais",
    datetime: "2026-09-24 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: "49248",
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "5",
    score_expression: "5",
    score_structure: "5",
    score_technique: "5",
    score_conversation: "5",
    score_general: "5",
    cecrl_label: "C2",
    bloc_introduction: "Anglais bilingue.",
    bloc_comprehension:
      "Retenez les mots « downhill » et « uphill » pour les intégrer à votre vocabulaire technique.",
    bloc_technique:
      "Maintenez ce niveau de maîtrise en intégrant downhill / uphill à votre vocabulaire technique. Le C2 (Niveau 5 — Maîtrise) correspond à une maîtrise proche du bilingue dans tous les contextes.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique: null,
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "bf7c645e-8f34-4830-af0d-a098de878170",
    candidate_name: "Manon Jouffrey",
    language: "anglais",
    datetime: "2026-09-24 08:00:00+00",
    previous_test: false,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: "54076",
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "3",
    score_expression: "2",
    score_structure: "2.5",
    score_technique: "2.5",
    score_conversation: "2",
    score_general: "2.5",
    cecrl_label: "B1+",
    bloc_introduction:
      "De bons éléments dans la structure des phrases (utilisation du passé plutôt correcte). De bons éléments aussi dans l'anglais technique. Audio : bien.",
    bloc_comprehension:
      "Points à consolider : could / should / must ; verbes à l'infinitif avec « for » ou « to ». Vocabulaire général à approfondir. L'échange manque un peu de fluidité : gagnez en spontanéité pour être plus moteur·rice de la conversation. Technique : continuez à développer le vocabulaire pour aller plus loin dans les explications — downhill, uphill, absorption, anticipation (ski sur bosses, virages…). Prononciation : put, relaxed.",
    bloc_technique:
      "Travaillez fluidité, spontanéité et vocabulaire (général et technique) pour atteindre le B2. Le B2 (Niveau 3 — Post-intermédiaire / Opérationnel) demande d'être opérationnel·le dans les situations professionnelles de votre métier.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique: null,
    verified_at: "2026-10-02 10:00:00+00",
  },
  {
    evaluation_id: "027e7fe0-db6f-4356-8cad-f49ec98596e0",
    candidate_name: "Richard Amory",
    language: "anglais",
    datetime: "2026-10-01 08:00:00+00",
    previous_test: true,
    sponsor_type: "esf",
    profession: "moniteur",
    carte_syndicale: "54032",
    ski_discipline: "alpin",
    training_cycle: "1",
    ski_school_name: "ESF Courchevel 1550",
    instructor_first_name: "Anna",
    instructor_last_name: "Tessier",
    score_comprehension: "2.5",
    score_expression: "2.5",
    score_structure: "2",
    score_technique: "3",
    score_conversation: "2.5",
    score_general: "2.5",
    cecrl_label: "B1+",
    bloc_introduction:
      "Bonne prononciation. Vous pouvez tenir une conversation sur des sujets de base. Vocabulaire technique solide et explications plutôt détaillées : c'est votre point fort.",
    bloc_comprehension:
      "Fluidité encore à développer : entraînez-vous à parler (même seul) et approfondissez le vocabulaire. Grammaire : temps du passé ; verbes à l'infinitif (for / to) ; since / for ; maladresses du type « I'm stop » → « I stopped » ; « 2 child » → « 2 children ». Compréhension à approfondir (oublis dans l'audio). Technique : quelques maladresses de structure (« it's gently slope »), à côté d'un bon vocabulaire.",
    bloc_technique:
      "Travaillez en priorité la compréhension et quelques points de grammaire importants : vous passerez rapidement au niveau supérieur. Le B2 (Niveau 3 — Post-intermédiaire / Opérationnel) demande d'être opérationnel·le dans les situations professionnelles de votre métier.",
    bloc_conclusion: "Bonne continuation !",
    note_methodologique: null,
    verified_at: "2026-10-02 10:00:00+00",
  },
];

function n(v: string): number {
  return Number(v);
}

function slugName(name: string, language: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `evaluation-${base}-${language}.pdf`;
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
  };
}

function buildInput(row: EvalRow): EvaluationPdfInput {
  const instructor = [row.instructor_first_name, row.instructor_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    sponsorType: row.sponsor_type,
    evaluatedAt: new Date(row.datetime),
    candidateName: row.candidate_name,
    candidateProfession: row.profession,
    skiDiscipline: row.ski_discipline,
    trainingCycle: row.training_cycle,
    carteSyndicale: row.carte_syndicale,
    language: row.language,
    previousTest: row.previous_test,
    skiSchoolName: row.ski_school_name,
    companyName: row.ski_school_name,
    instructorName: instructor || null,
    scores: {
      comprehension: n(row.score_comprehension),
      expression: n(row.score_expression),
      structure: n(row.score_structure),
      technique: n(row.score_technique),
      conversation: n(row.score_conversation),
      general: n(row.score_general),
    },
    cecrlGeneral: row.cecrl_label,
    blocs: {
      introduction: row.bloc_introduction ?? "",
      comprehension: row.bloc_comprehension ?? "",
      technique: row.bloc_technique ?? "",
      conclusion: row.bloc_conclusion ?? "",
    },
    noteMethodologique: row.note_methodologique,
    priceTtc: 45,
    identity: IDENTITY,
    cecrlScale: SCALE,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
  };
}

function emailHtml(): string {
  const body = `Bonjour Stéphanie,<br/><br/>
comme convenu, voici les résultats de tests demandés. Les prochains seront systématiquement envoyés à ton adresse et à celle de Lucas. Je m'excuse pour cela, nous avons un nouveau système de gestion et nous ajustons les process au fur et à mesure. N'hésite pas à me recontacter s'il y a un autre souci.<br/><br/>
Cordialement,<br/>
<strong>FLI — France Langues International</strong><br/>
25 avenue de la Gare<br/>
73800 Montmélian<br/>
Tél. : 04 79 28 21 09<br/>
<a href="mailto:info@fli.fr">info@fli.fr</a>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e8e8">
<tr><td style="padding:28px 24px 24px;font-size:15px;line-height:1.55;font-family:Georgia,'Times New Roman',serif;color:#111">
<p style="margin:0 0 16px">${body}</p>
</td></tr>
</table>
</td></tr>
</table>`;
}

async function main() {
  const doSend = process.env.SEND === "1";
  const apiKey = process.env.RESEND_API_KEY;
  await mkdir(OUT_DIR, { recursive: true });
  const assets = await loadAssets();
  const attachments: Array<{ filename: string; content: string; path: string }> =
    [];

  for (const row of ROWS) {
    const model = buildEvaluationPdfModel(buildInput(row));
    const bytes = await renderEvaluationPdf(model, assets);
    const filename = slugName(row.candidate_name, row.language);
    const path = join(OUT_DIR, filename);
    await writeFile(path, bytes);
    attachments.push({
      filename,
      content: Buffer.from(bytes).toString("base64"),
      path,
    });
    console.log(`PDF OK ${filename} (${bytes.length} octets)`);
  }

  const manifest = {
    to: TO,
    cc: CC,
    bcc: BCC,
    subject: SUBJECT,
    attachments: attachments.map((a) => a.filename),
    evaluation_ids: ROWS.map((r) => r.evaluation_id),
    dry_run: !doSend,
  };
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  if (!doSend) {
    console.log("Dry-run : PDF générés, aucun envoi (relancer avec SEND=1).");
    return;
  }
  if (!apiKey) {
    throw new Error("RESEND_API_KEY absente");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FLI — France Langues International <noreply@fli.fr>",
      to: [TO],
      cc: CC,
      bcc: [BCC],
      reply_to: ["info@fli.fr"],
      subject: SUBJECT,
      html: emailHtml(),
      attachments: attachments.map(({ filename, content }) => ({
        filename,
        content,
      })),
    }),
  });

  const text = await response.text();
  await writeFile(join(OUT_DIR, "resend-response.json"), text);
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${text}`);
  }
  console.log(`ENVOYE ${text}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

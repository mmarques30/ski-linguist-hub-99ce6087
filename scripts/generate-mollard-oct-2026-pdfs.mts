/**
 * Génère les 17 PDF d'évaluation du lot Mollard oct. 2026 (dry-run, aucun envoi).
 * Usage : npx tsx scripts/generate-mollard-oct-2026-pdfs.mts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  SKILL_ORDER,
  buildEvaluationPdfModel,
  formatScoreFr,
  type CecrlScaleRow,
  type EvaluationPdfInput,
  type FliIdentity,
} from "../src/lib/evaluation-pdf.ts";
import {
  EVALUATION_PDF_ASSET_FILES,
  type EvaluationPdfAssets,
} from "../src/lib/evaluation-pdf-assets.ts";
import { renderEvaluationPdf } from "../src/lib/evaluation-pdf-render.ts";
import { alpeDhuezFromScore20 } from "../src/lib/evaluation-utils.ts";

const OUT_DIR = "/opt/cursor/artifacts/mollard-oct-2026/pdfs";
const ROWS_PATH = join(process.cwd(), "scripts/data/mollard-oct-2026-pdf-rows.json");

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
  key: string;
  scoring_system?: "sur_5" | "sur_20";
  /** Notes affichées (ex. /20 Alpe d'Huez) — distinctes des scores PDF /5 internes. */
  display_scores?: number[];
};

function n(v: string): number {
  return Number(v);
}

function slugName(name: string, language: string, key: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  // clé pour distinguer les 2 Montaine
  return `evaluation-${base}-${language}-${key}.pdf`;
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

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const rows = JSON.parse(await readFile(ROWS_PATH, "utf8")) as EvalRow[];
  const assets = await loadAssets();
  const generated: Array<{ key: string; filename: string; bytes: number; evaluation_id: string }> =
    [];

  for (const row of rows) {
    const model = buildEvaluationPdfModel(buildInput(row));
    // Alpe d'Huez : affichage « Niveau - note /20 » + qualificatif du tableau
    if (row.scoring_system === "sur_20" && row.display_scores?.length === 6) {
      model.skillRows = SKILL_ORDER.map(({ label }, i) => {
        const score = row.display_scores![i];
        const band = alpeDhuezFromScore20(score);
        return {
          label,
          value: `${band.cecrl} - ${formatScoreFr(score)} (${band.qualifier})`,
        };
      });
      const g = row.display_scores[5];
      const gBand = alpeDhuezFromScore20(g);
      model.subtitle = model.subtitle.replace(
        /— [\d,]+ \/ [A-C]\d\+?/,
        `— ${formatScoreFr(g)} / 20 (${gBand.cecrl} · ${gBand.keyword} · ${gBand.qualifier})`
      );
      model.noteMethodologique =
        row.note_methodologique?.trim() ||
        `Barème Alpe d'Huez /20 — ${gBand.cecrl} Niveau ${gBand.niveau} ${gBand.keyword} (${gBand.qualifier}).`;
    }
    const bytes = await renderEvaluationPdf(model, assets);
    const filename = slugName(row.candidate_name, row.language, row.key);
    const path = join(OUT_DIR, filename);
    await writeFile(path, bytes);
    generated.push({
      key: row.key,
      filename,
      bytes: bytes.length,
      evaluation_id: row.evaluation_id,
    });
    console.log(`PDF OK ${filename} (${bytes.length} octets)`);
  }

  await writeFile(
    join(OUT_DIR, "../pdf-manifest.json"),
    JSON.stringify({ count: generated.length, generated }, null, 2)
  );
  console.log(`Done: ${generated.length} PDFs → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

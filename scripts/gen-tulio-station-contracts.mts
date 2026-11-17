/**
 * Génère les 3 contrats stage station Tulio (modèle app + signature Paula).
 * Sortie : /opt/cursor/artifacts/tulio-station-contracts/
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FORMATEUR_CONTRACT_SIGNATURE_ASSET,
  FORMATEUR_CONTRACT_SIGNATURE_FALLBACK,
  buildInstructorContractPdf,
  instructorContractFilename,
} from "../src/lib/instructor-contract-pdf.ts";

const OUT = "/opt/cursor/artifacts/tulio-station-contracts";
mkdirSync(OUT, { recursive: true });

const PRESTATAIRE =
  "Monsieur Tulio Rezende Ferreira Moura, auto-entrepreneur, SIRET 993 150 960 00017, 25 avenue de la Gare, 73800 Montmélian — tuliorfmoura@gmail.com — 07 45 19 75 89";

const RATE = 30;
const ISSUED = "17/11/2026";

function loadSignature(): Uint8Array {
  try {
    return new Uint8Array(
      readFileSync(join(process.cwd(), "public", FORMATEUR_CONTRACT_SIGNATURE_ASSET)),
    );
  } catch {
    return new Uint8Array(
      readFileSync(
        join(process.cwd(), "public", FORMATEUR_CONTRACT_SIGNATURE_FALLBACK),
      ),
    );
  }
}

const missions = [
  {
    contractNumber: "CTR-2026-0017",
    locationLabel: "Val d'Isère",
    missionLabel: "Stage Portugais Brésilien — ESF Val d'Isère",
    volumeNote:
      "2 groupes — 24 h stagiaires : 16 h lun.–jeu. + 8 h vendredi par groupe",
    durationHours: 40,
    startDate: "2026-11-23",
    endDate: "2026-11-27",
    student_or_company: "Stage Portugais — ESF Val d'Isère",
  },
  {
    contractNumber: "CTR-2026-0018",
    locationLabel: "La Rosière",
    missionLabel: "Stage Portugais Brésilien — ESF La Rosière",
    volumeNote: "2 semaines × 2 groupes × 20 h",
    durationHours: 80,
    startDate: "2026-11-30",
    endDate: "2026-12-11",
    student_or_company: "Stage Portugais — ESF La Rosière",
  },
  {
    contractNumber: "CTR-2026-0019",
    locationLabel: "Samoëns",
    missionLabel: "Stage Portugais Brésilien — ESF Samoëns",
    volumeNote: "2 groupes × 20 h",
    durationHours: 40,
    startDate: "2026-12-14",
    endDate: "2026-12-18",
    student_or_company: "Stage Portugais — ESF Samoëns",
  },
] as const;

async function main() {
  const sig = loadSignature();
  const meta = [];
  for (const m of missions) {
    const pdf = await buildInstructorContractPdf({
      contractNumber: m.contractNumber,
      prestataireLine: PRESTATAIRE,
      languageLabel: "portugais",
      modality: "station_group",
      missionLabel: m.missionLabel,
      volumeNote: m.volumeNote,
      durationHours: m.durationHours,
      hourlyRate: RATE,
      startDate: m.startDate,
      endDate: m.endDate,
      locationLabel: m.locationLabel,
      organismSignaturePng: sig,
      issuedAtLabel: ISSUED,
    });
    const filename = instructorContractFilename(m.contractNumber, "Tulio-Rezende");
    const path = join(OUT, filename);
    writeFileSync(path, pdf);
    meta.push({
      ...m,
      hourly_rate: RATE,
      total_amount: m.durationHours * RATE,
      filename,
      path,
      bytes: pdf.byteLength,
    });
    console.log(filename, pdf.byteLength);
  }
  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(JSON.stringify({ out: OUT, count: meta.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

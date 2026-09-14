/**
 * C.5 — modèle PDF d'évaluation (trois habillages).
 * Aligné sur src/lib/evaluation-pdf.ts — cartes minimales, sans React.
 */

const LANGUAGE_LABELS: Record<string, string> = {
  all: "Toutes langues",
  anglais: "Anglais",
  portugais: "Portugais brésilien",
  espagnol: "Espagnol",
  neerlandais: "Néerlandais",
  russe: "Russe",
  italien: "Italien",
  chinois: "Chinois (Mandarin)",
  allemand: "Allemand",
  fle: "Français Langue Étrangère",
};

const SCORE_TO_LEVEL_5: Record<number, string> = {
  0: "A1", 0.5: "A1+",
  1: "A2", 1.5: "A2+",
  2: "B1", 2.5: "B1+",
  3: "B2", 3.5: "B2+",
  4: "C1", 4.5: "C1+",
  5: "C2",
};

export const EVALUATION_PDF_BUCKET = "evaluation-pdfs";

export type SponsorType = "esf" | "ecole_ski" | "dsf";

export type FliIdentity = {
  legal_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
};

/** Aligné sur app_settings.fli_identity et le pied du .dotx ecole_ski. */
export const DEFAULT_FLI_IDENTITY: FliIdentity = {
  legal_name: "France Langues International",
  address_line: "25 avenue de la Gare",
  postal_code: "73800",
  city: "Montmélian",
  phone: "09 81 84 60 65",
  email: "info@fli.fr",
};

export type EvaluationPdfScores = {
  comprehension: number;
  expression: number;
  structure: number;
  technique: number;
  conversation: number;
  general: number;
};

export type EvaluationPdfBlocs = {
  introduction: string;
  comprehension: string;
  technique: string;
  conclusion: string;
};

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function scoreGeneralCalcule(scores: EvaluationPdfScores): number {
  const keys = [
    "comprehension",
    "expression",
    "structure",
    "technique",
    "conversation",
  ] as const;
  const sum = keys.reduce((acc, key) => acc + scores[key], 0);
  return roundToHalf(sum / keys.length);
}

function needsMethodoNote(general: number, calcule: number): boolean {
  return Math.round((general - calcule) * 2) / 2 !== 0;
}


export type CecrlScaleRow = {
  score: number;
  cecrl_label: string;
  base_label?: string | null;
  niveau?: number | null;
  description?: string | null;
};

export type EvaluationPdfInput = {
  sponsorType: string;
  evaluatedAt: Date;
  candidateName: string;
  candidateProfession?: string | null;
  carteSyndicale?: string | null;
  language: string;
  previousTest: boolean;
  skiSchoolName: string | null;
  companyName: string | null;
  instructorName: string | null;
  scores: EvaluationPdfScores;
  cecrlGeneral: string | null;
  blocs: EvaluationPdfBlocs;
  noteMethodologique: string | null;
  priceTtc: number | null;
  identity: FliIdentity;
  cecrlScale?: CecrlScaleRow[] | null;
};

export type SkillRow = { label: string; value: string };

export type BaremeRow = {
  score: number;
  cecrl: string;
  niveau: number;
  labels: string;
};

export type ResolvedLevel = {
  score: number;
  cecrl: string;
  niveau: number;
  description: string;
};

export type EvaluationPdfModel = {
  habillage: SponsorType;
  title: string;
  seasonLabel: string;
  subtitle: string;
  showPrice: boolean;
  priceLabel: string | null;
  showCourseTable: boolean;
  showRegionalSections: boolean;
  showCompanyField: boolean;
  showFliHeaderFooter: boolean;
  showSyndicateHeader: boolean;
  showDsfLetterhead: boolean;
  candidateName: string;
  candidateDisplayName: string;
  candidateProfession: string;
  carteSyndicale: string;
  languageLabel: string;
  previousTestLabel: string;
  skiSchoolName: string;
  companyName: string;
  instructorName: string;
  evaluatedOn: string;
  skillRows: SkillRow[];
  baremeRows: BaremeRow[];
  noteMethodologique: string | null;
  blocs: { label: string; text: string }[];
  identity: FliIdentity;
  identityLine: string;
};

/** Tableau niveau ↔ type de cours, transcrit du .dotx ESF. */
export const ESF_COURSE_TABLE: ReadonlyArray<{ course: string; level: string }> = [
  { course: "Cours collectifs enfants", level: "B1" },
  { course: "Cours collectifs mélangé franglais", level: "A2" },
  { course: "Cours collectifs adultes", level: "B2" },
  {
    course: "Cours adultes individuels (ou 2 personnes) pour 1 ou 2 H",
    level: "C1",
  },
  {
    course: "Cours adultes individuels (ou 2 personnes) pour une journée ou plus",
    level: "C2",
  },
];

/** Sections régionales SNMSF, transcrites du .dotx ESF. */
export const ESF_REGIONAL_SECTIONS: ReadonlyArray<{
  phone: string;
  places: string;
}> = [
  { phone: "04 79 04 15 50", places: "73700 BOURG SAINT MAURICE" },
  { phone: "04 92 21 27 33", places: "05100 BRIANCON" },
  { phone: "03 29 33 88 88", places: "88000 EPINAL" },
  { phone: "04 79 33 89 89", places: "73000 CHAMBERY" },
  { phone: "04 79 28 21 09", places: "73800 FRANCIN" },
  { phone: "05 62 53 14 14", places: "65000 TARBES" },
  {
    phone: "04 79 37 19 78",
    places: "74120 MEGEVE – 73200 ALBERTVILLE – 74400 CHAMONIX",
  },
];

/** Barème européen du .dotx (A1–C2 / niveaux 0–5). Repli si cecrl_scale incomplet. */
export const CECRL_BAREME: ReadonlyArray<BaremeRow> = [
  { score: 0, cecrl: "A1", niveau: 0, labels: "Faux débutant / Quelques notions / Éveil" },
  { score: 1, cecrl: "A2", niveau: 1, labels: "Élémentaire / Pré-intermédiaire / Survie" },
  { score: 2, cecrl: "B1", niveau: 2, labels: "Intermédiaire / Autonomie" },
  { score: 3, cecrl: "B2", niveau: 3, labels: "Post intermédiaire / Opérationnel" },
  { score: 4, cecrl: "C1", niveau: 4, labels: "Perfectionnement / Fluidité / Aisance" },
  { score: 5, cecrl: "C2", niveau: 5, labels: "Maîtrise" },
];

export const ESF_DIRECTOR_NOTE =
  "L'affectation des cours en fonction du niveau de langue reste à l'appréciation des directeurs.";

export const ESF_RETEST_NOTE =
  "Nous vous recommandons de tester vos capacités en langues tous les deux ans.";

export const ESF_ORGANISMES_CAPTION = "Organismes agréés";

export const ESF_COURSE_HEADING =
  "Corrélation entre le niveau d'anglais du moniteur ESF et le niveau du cours enseigné :";

/** Mêmes libellés, même ordre, sur les trois habillages. */
export const SKILL_ORDER: Array<{ key: keyof EvaluationPdfScores; label: string }> = [
  { key: "comprehension", label: "Compréhension" },
  { key: "expression", label: "Expression" },
  { key: "structure", label: "Structures de la langue" },
  { key: "technique", label: "Expression technique et spécifique" },
  { key: "conversation", label: "Conversation générale" },
  { key: "general", label: "Appréciation générale" },
];

export function isSponsorType(value: string): value is SponsorType {
  return value === "esf" || value === "ecole_ski" || value === "dsf";
}

export function habillageFromSponsorType(value: string): SponsorType {
  if (!isSponsorType(value)) {
    throw new Error(`sponsor_type inconnu : ${value}`);
  }
  return value;
}

/** Saison ski : 1er juillet N → 30 juin N+1 = saison N / N+1. */
export function skiSeasonYears(date: Date): { start: number; end: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return { start: year, end: year + 1 };
  return { start: year - 1, end: year };
}

export function formatSeasonLabel(date: Date): string {
  const { start, end } = skiSeasonYears(date);
  return `${start} / ${end}`;
}

export function evaluationTitle(date: Date): string {
  return `Évaluation en langue vivante saison ${formatSeasonLabel(date)}`;
}

export function parseEvaluationPriceTtc(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return parseEvaluationPriceTtc(rec.amount ?? rec.value ?? rec.ttc);
  }
  return null;
}

export function formatPriceTtc(amount: number): string {
  const shown = Number.isInteger(amount) ? String(amount) : String(amount).replace(".", ",");
  return `${shown} € TTC`;
}

export function formatScoreFr(score: number): string {
  if (Number.isInteger(score)) return String(score);
  return String(score).replace(".", ",");
}

export function cecrlFromScore(score: number): string {
  return SCORE_TO_LEVEL_5[score] ?? "";
}

export function formatScoreCecrl(score: number, cecrlLabel?: string | null): string {
  const label = (cecrlLabel && cecrlLabel.trim()) || cecrlFromScore(score) || "—";
  return `${formatScoreFr(score)} - ${label}`;
}

export function parseFliIdentity(value: unknown): FliIdentity | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  const legal_name = typeof rec.legal_name === "string" ? rec.legal_name.trim() : "";
  const address_line = typeof rec.address_line === "string" ? rec.address_line.trim() : "";
  const postal_code = typeof rec.postal_code === "string" ? rec.postal_code.trim() : "";
  const city = typeof rec.city === "string" ? rec.city.trim() : "";
  const phone = typeof rec.phone === "string" ? rec.phone.trim() : "";
  const email = typeof rec.email === "string" ? rec.email.trim() : "";
  if (!legal_name || !address_line || !postal_code || !city) return null;
  return { legal_name, address_line, postal_code, city, phone, email };
}

export function formatIdentityLine(identity: FliIdentity): string {
  const city = `${identity.postal_code} ${identity.city}`.trim();
  const parts = [
    identity.legal_name,
    identity.address_line,
    city,
    identity.phone ? `Tél. : ${identity.phone}` : "",
    identity.email,
  ].filter(Boolean);
  return parts.join(" — ");
}

function formatDateFr(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export function asScoreNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

/** Palier 0–5 : floor de la note (0 et 0,5 → 0). */
export function integerNiveau(score: number): number {
  const n = asScoreNumber(score);
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.floor(n);
}

export function formatNiveauTableLabel(niveau: number): string {
  return niveau <= 0 ? "Niveau d'entrée 0" : `Niveau ${niveau}`;
}

export function formatCandidateDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.slice(1).join(" ").toUpperCase()}`;
}

export function normalizeCecrlScale(rows?: CecrlScaleRow[] | null): CecrlScaleRow[] {
  if (!rows?.length) {
    return CECRL_BAREME.map((row) => ({
      score: row.score,
      cecrl_label: row.cecrl,
      base_label: row.cecrl,
      niveau: row.niveau,
      description: row.labels,
    }));
  }
  return [...rows]
    .map((row) => ({
      ...row,
      score: asScoreNumber(row.score),
      niveau: row.niveau ?? integerNiveau(asScoreNumber(row.score)),
      description: row.description?.trim() || null,
    }))
    .sort((a, b) => a.score - b.score);
}

export function baremeRowsFromScale(rows?: CecrlScaleRow[] | null): BaremeRow[] {
  const scale = normalizeCecrlScale(rows);
  const integers = scale.filter((row) => Number.isInteger(row.score));
  if (integers.length < 6) return [...CECRL_BAREME];
  return integers.map((row) => {
    const niveau = row.niveau ?? integerNiveau(row.score);
    const fallback = CECRL_BAREME.find((item) => item.niveau === niveau);
    return {
      score: row.score,
      cecrl: row.cecrl_label,
      niveau,
      labels: row.description || fallback?.labels || "",
    };
  });
}

export function resolveLevel(
  score: number,
  scale: CecrlScaleRow[],
  cecrlHint?: string | null
): ResolvedLevel {
  const n = asScoreNumber(score);
  const normalized = normalizeCecrlScale(scale);
  const exact = normalized.find((row) => row.score === n);
  const palier = exact?.niveau ?? integerNiveau(n);
  const integerRow = normalized.find((row) => row.score === palier);
  const fallback = CECRL_BAREME.find((row) => row.niveau === palier) ?? CECRL_BAREME[0];
  return {
    score: n,
    cecrl:
      (cecrlHint && cecrlHint.trim()) ||
      exact?.cecrl_label ||
      cecrlFromScore(n) ||
      fallback.cecrl,
    niveau: palier,
    description:
      exact?.description || integerRow?.description || fallback.labels,
  };
}

export function nextCecrlLevel(
  score: number,
  scale: CecrlScaleRow[]
): ResolvedLevel | null {
  const palier = integerNiveau(score);
  if (palier >= 5) return null;
  return resolveLevel(palier + 1, scale);
}

export function techniqueBlocLabel(next: ResolvedLevel | null, current: ResolvedLevel): string {
  const target = next ?? current;
  return `Pour passer au ${target.cecrl} (Niveau ${target.niveau} - ${target.description})`;
}

export function evaluationSubtitle(input: {
  candidateName: string;
  generalScore: number;
  current: ResolvedLevel;
  next: ResolvedLevel | null;
  languageLabel: string;
  instructorName: string;
}): string {
  const name = formatCandidateDisplayName(input.candidateName);
  const note = formatScoreFr(input.generalScore);
  const objectif = input.next?.cecrl ?? input.current.cecrl;
  const evaluator = input.instructorName.trim() || "—";
  return `${name} — ${note} / ${input.current.cecrl} - Niveau ${input.current.niveau} - ${input.current.description} → ${objectif} (${input.languageLabel} — évaluateur·rice : ${evaluator})`;
}

function skillRowsFor(
  scores: EvaluationPdfScores,
  cecrlGeneral: string | null,
  scale: CecrlScaleRow[]
): SkillRow[] {
  return SKILL_ORDER.map(({ key, label }) => {
    const hint = key === "general" ? cecrlGeneral : resolveLevel(scores[key], scale).cecrl;
    return {
      label,
      value: formatScoreCecrl(scores[key], hint),
    };
  });
}

function commentBlocs(
  input: EvaluationPdfBlocs,
  current: ResolvedLevel,
  next: ResolvedLevel | null
): { label: string; text: string }[] {
  return [
    { label: "Points forts", text: input.introduction?.trim() || "" },
    { label: "À consolider", text: input.comprehension?.trim() || "" },
    {
      label: techniqueBlocLabel(next, current),
      text: input.technique?.trim() || "",
    },
    { label: "Clôture", text: input.conclusion?.trim() || "" },
  ];
}

export function buildEvaluationPdfModel(input: EvaluationPdfInput): EvaluationPdfModel {
  const habillage = habillageFromSponsorType(input.sponsorType);
  const showPrice = habillage !== "dsf";
  const priceLabel =
    showPrice && input.priceTtc != null ? formatPriceTtc(input.priceTtc) : null;
  if (showPrice && priceLabel == null) {
    throw new Error("evaluation_price_ttc manquant pour cet habillage");
  }

  const scale = normalizeCecrlScale(input.cecrlScale);
  const current = resolveLevel(input.scores.general, scale, input.cecrlGeneral);
  const next = nextCecrlLevel(input.scores.general, scale);
  const languageLabel = LANGUAGE_LABELS[input.language] || input.language;
  const instructorName = input.instructorName?.trim() || "—";
  const calcule = scoreGeneralCalcule(input.scores);
  const methodo =
    needsMethodoNote(input.scores.general, calcule)
      ? input.noteMethodologique?.trim() || null
      : null;

  return {
    habillage,
    title: evaluationTitle(input.evaluatedAt),
    seasonLabel: formatSeasonLabel(input.evaluatedAt),
    subtitle: evaluationSubtitle({
      candidateName: input.candidateName,
      generalScore: input.scores.general,
      current,
      next,
      languageLabel,
      instructorName,
    }),
    showPrice,
    priceLabel,
    showCourseTable: habillage === "esf",
    showRegionalSections: habillage === "esf",
    showCompanyField: habillage === "dsf",
    showFliHeaderFooter: habillage === "ecole_ski",
    showSyndicateHeader: habillage === "esf",
    showDsfLetterhead: habillage === "dsf",
    candidateName: input.candidateName,
    candidateDisplayName: formatCandidateDisplayName(input.candidateName),
    candidateProfession: input.candidateProfession?.trim() || "—",
    carteSyndicale: input.carteSyndicale?.trim() || "—",
    languageLabel,
    previousTestLabel: input.previousTest ? "OUI" : "NON",
    skiSchoolName: input.skiSchoolName?.trim() || "—",
    companyName: (input.companyName || input.skiSchoolName || "").trim() || "—",
    instructorName,
    evaluatedOn: formatDateFr(input.evaluatedAt),
    skillRows: skillRowsFor(input.scores, input.cecrlGeneral, scale),
    baremeRows: baremeRowsFromScale(scale),
    noteMethodologique: methodo,
    blocs: commentBlocs(input.blocs, current, next),
    identity: input.identity,
    identityLine: formatIdentityLine(input.identity),
  };
}

export function evaluationPdfStoragePath(evaluationId: string): string {
  return `evaluations/${evaluationId}.pdf`;
}

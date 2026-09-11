/**
 * C.5 — modèle PDF d'évaluation (trois habillages).
 * Source de vérité : test_bookings.sponsor_type.
 * Tableau cours ESF et sections régionales extraits du .dotx (non inventés).
 */

import { LANGUAGE_LABELS, SCORE_TO_LEVEL_5 } from "./evaluation-utils";

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
};

export type SkillRow = { label: string; value: string };

export type EvaluationPdfModel = {
  habillage: SponsorType;
  title: string;
  yearLabel: string;
  showPrice: boolean;
  priceLabel: string | null;
  showCourseTable: boolean;
  showRegionalSections: boolean;
  showCompanyField: boolean;
  showFliHeaderFooter: boolean;
  showSyndicateHeader: boolean;
  candidateName: string;
  candidateProfession: string;
  carteSyndicale: string;
  languageLabel: string;
  previousTestLabel: string;
  skiSchoolName: string;
  companyName: string;
  instructorName: string;
  evaluatedOn: string;
  skillRows: SkillRow[];
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

/** Barème européen du .dotx ESF (A1–C2 / niveaux 0–5). */
export const CECRL_BAREME: ReadonlyArray<{
  cecrl: string;
  niveau: string;
  labels: string;
}> = [
  { cecrl: "A1", niveau: "Niveau d'entrée 0", labels: "Faux débutant · Quelques notions · Éveil" },
  { cecrl: "A2", niveau: "Niveau 1", labels: "Élémentaire · Pré-intermédiaire · Survie" },
  { cecrl: "B1", niveau: "Niveau 2", labels: "Intermédiaire · Autonomie" },
  { cecrl: "B2", niveau: "Niveau 3", labels: "Post intermédiaire · Opérationnel" },
  { cecrl: "C1", niveau: "Niveau 4", labels: "Perfectionnement · Fluidité · Aisance" },
  { cecrl: "C2", niveau: "Niveau 5", labels: "Maîtrise" },
];

export const ESF_DIRECTOR_NOTE =
  "L'affectation des cours en fonction du niveau de langue reste à l'appréciation des directeurs.";

export const ESF_RETEST_NOTE =
  "Nous vous recommandons de tester vos capacités en langues tous les deux ans.";

const ESF_SKILL_ORDER: Array<{ key: keyof EvaluationPdfScores; label: string }> = [
  { key: "comprehension", label: "Compréhension" },
  { key: "expression", label: "Expression" },
  { key: "structure", label: "Structures de la langue" },
  { key: "technique", label: "Expression technique et spécifique" },
  { key: "conversation", label: "Conversation générale" },
  { key: "general", label: "APPRÉCIATION GÉNÉRALE" },
];

const ECOLE_SKI_SKILL_ORDER: Array<{
  key: keyof EvaluationPdfScores;
  label: string;
}> = [
  { key: "expression", label: "Expression" },
  { key: "conversation", label: "Conversation générale" },
  {
    key: "structure",
    label: "Connaissances grammaticales (structure de la langue)",
  },
  { key: "comprehension", label: "Compréhension" },
  {
    key: "technique",
    label: "Vocabulaire technique spécifique et phraséologie de l'enseignement du ski",
  },
  { key: "general", label: "Appréciation générale" },
];

const BLOC_LABELS: Array<{ key: keyof EvaluationPdfBlocs; label: string }> = [
  { key: "introduction", label: "Introduction" },
  { key: "comprehension", label: "Compréhension" },
  { key: "technique", label: "Technique" },
  { key: "conclusion", label: "Conclusion" },
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

export function evaluationTitle(date: Date): string {
  const { start, end } = skiSeasonYears(date);
  return `Évaluation en langue vivante saison ${start} / ${end}`;
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

function skillRowsFor(
  habillage: SponsorType,
  scores: EvaluationPdfScores,
  cecrlGeneral: string | null
): SkillRow[] {
  const order = habillage === "ecole_ski" ? ECOLE_SKI_SKILL_ORDER : ESF_SKILL_ORDER;
  return order.map(({ key, label }) => ({
    label,
    value: formatScoreCecrl(
      scores[key],
      key === "general" ? cecrlGeneral : cecrlFromScore(scores[key])
    ),
  }));
}

export function buildEvaluationPdfModel(input: EvaluationPdfInput): EvaluationPdfModel {
  const habillage = habillageFromSponsorType(input.sponsorType);
  const showPrice = habillage !== "dsf";
  const priceLabel =
    showPrice && input.priceTtc != null ? formatPriceTtc(input.priceTtc) : null;
  if (showPrice && priceLabel == null) {
    throw new Error("evaluation_price_ttc manquant pour cet habillage");
  }

  return {
    habillage,
    title: evaluationTitle(input.evaluatedAt),
    yearLabel: String(skiSeasonYears(input.evaluatedAt).start),
    showPrice,
    priceLabel,
    showCourseTable: habillage === "esf",
    showRegionalSections: habillage === "esf",
    showCompanyField: habillage === "dsf",
    showFliHeaderFooter: habillage === "ecole_ski",
    showSyndicateHeader: habillage === "esf",
    candidateName: input.candidateName,
    candidateProfession: input.candidateProfession?.trim() || "—",
    carteSyndicale: input.carteSyndicale?.trim() || "—",
    languageLabel: LANGUAGE_LABELS[input.language] || input.language,
    previousTestLabel: input.previousTest ? "OUI" : "NON",
    skiSchoolName: input.skiSchoolName?.trim() || "—",
    companyName: (input.companyName || input.skiSchoolName || "").trim() || "—",
    instructorName: input.instructorName?.trim() || "—",
    evaluatedOn: formatDateFr(input.evaluatedAt),
    skillRows: skillRowsFor(habillage, input.scores, input.cecrlGeneral),
    noteMethodologique: input.noteMethodologique?.trim() || null,
    blocs: BLOC_LABELS.map(({ key, label }) => ({
      label,
      text: input.blocs[key]?.trim() || "",
    })),
    identity: input.identity,
    identityLine: formatIdentityLine(input.identity),
  };
}

export function evaluationPdfStoragePath(evaluationId: string): string {
  return `evaluations/${evaluationId}.pdf`;
}

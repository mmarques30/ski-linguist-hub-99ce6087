/**
 * FIFPL — moniteurs de ski 2026 (profession 8551 Z).
 *
 * Source : « Critères de prise en charge Moniteurs de ski 2026.pdf »
 * (Conseil de Gestion du 20 novembre 2025) :
 * - Formations cœur de métier (dont langues étrangères) : plafond 900 € / an,
 *   300 € / jour, au coût réel
 * - E-learning asynchrone : 50 % des critères journaliers et annuels
 *   (la visio FLI synchrone compte comme du présentiel — plafond 900 €)
 * - Indépendants : 100 % des critères
 * - Micro-entrepreneurs : % selon cotisation CFP (tableau page 3)
 * - Autre formation déjà prise en charge sur le forfait annuel : déduite des droits
 */

export const FIFPL_CRITERIA_YEAR = 2026;

/**
 * Années d'attestation CFP URSSAF acceptées à l'inscription.
 * Année des critères + N-1 (ex. début de saison, attestation 2025 encore en circulation).
 */
export const FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS = [
  FIFPL_CRITERIA_YEAR - 1,
  FIFPL_CRITERIA_YEAR,
] as const;

export function isAcceptedCfpAttestationYear(
  year: number | null | undefined
): year is (typeof FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS)[number] {
  return (
    year != null &&
    (FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS as readonly number[]).includes(year)
  );
}

export function formatAcceptedCfpAttestationYears(): string {
  return FIFPL_ACCEPTED_CFP_ATTESTATION_YEARS.join(" ou ");
}

/** Plafond annuel formations cœur de métier (langues = cœur de métier). */
export const FIFPL_ANNUAL_CEILING_EUR = 900;

/** Plafond journalier cœur de métier. */
export const FIFPL_DAILY_CEILING_EUR = 300;

/**
 * E-learning asynchrone uniquement : 50 % des critères annuels / journaliers.
 * Les formations FLI en visio (synchrone) sont traitées comme du présentiel FIFPL.
 */
export const FIFPL_ELEARNING_FACTOR = 0.5;

export type FifplProfessionalStatus = "independant" | "micro_entrepreneur";

/** Tranches page 3 — micro-entrepreneurs, proportionnel à la cotisation CFP. */
export const FIFPL_MICRO_CFP_BRACKETS: ReadonlyArray<{
  minEur: number;
  maxEur: number | null;
  percent: number;
}> = [
  { minEur: 1, maxEur: 20, percent: 20 },
  { minEur: 21, maxEur: 40, percent: 40 },
  { minEur: 41, maxEur: 80, percent: 60 },
  { minEur: 81, maxEur: 100, percent: 80 },
  { minEur: 101, maxEur: 115, percent: 90 },
  { minEur: 116, maxEur: null, percent: 100 },
];

export interface FifplQuestionnaire {
  /** Indépendant (100 %) ou micro-entrepreneur (grille CFP). */
  status: FifplProfessionalStatus | null;
  /** Année de l'attestation CFP URSSAF (si déposée). */
  cfpAttestationYear: number | null;
  /** Montant de cotisation CFP (€) — pour les micro. */
  cfpContributionEur: number | null;
  /** Chemin storage après upload (bucket documents) — facultatif. */
  cfpAttestationPath: string | null;
  cfpAttestationFileName: string | null;
  /** Autre formation déjà prise en charge FIFPL cette année ? */
  hadOtherFifplTrainingThisYear: boolean | null;
  /** Montant déjà pris en charge (€) si oui. */
  otherFifplAmountAlreadyCoveredEur: number | null;
  /** Avertissements du parseur PDF (année / montant). */
  parseWarnings: string[];
  /** Snapshot calculé à l'inscription (optionnel, pour le BO). */
  estimatedRights?: {
    rightsPercent: number;
    grossRightsEur: number;
    alreadyCoveredEur: number;
    remainingRightsEur: number;
    annualCeilingBaseEur: number;
  } | null;
}

export const EMPTY_FIFPL_QUESTIONNAIRE: FifplQuestionnaire = {
  status: null,
  cfpAttestationYear: null,
  cfpContributionEur: null,
  cfpAttestationPath: null,
  cfpAttestationFileName: null,
  hadOtherFifplTrainingThisYear: null,
  otherFifplAmountAlreadyCoveredEur: null,
  parseWarnings: [],
};

export interface FifplRightsEstimate {
  criteriaYear: number;
  /** Plafond annuel applicable (900 €, ou 450 € si e-learning). */
  annualCeilingBaseEur: number;
  isElearning: boolean;
  rightsPercent: number;
  /** Droits bruts = plafond annuel × taux (avant déduction). */
  grossRightsEur: number;
  /** Montant déjà pris en charge FIFPL cette année (saisi). */
  alreadyCoveredEur: number;
  /** Droits restants sur le forfait annuel après déduction. */
  remainingRightsEur: number;
  dailyCeilingEur: number;
  /** true si micro sans cotisation → pire cas 20 %. */
  isProvisionalMicroEstimate: boolean;
  /** Si tarif formation fourni : prise en charge estimée sur ce stage. */
  coveredOnCourseEur: number | null;
  /** Si tarif formation fourni : reste à charge estimé. */
  remainingChargeEur: number | null;
}

/**
 * Plafond e-learning FIFPL (50 %) = formations asynchrones uniquement.
 * Les modalités FLI `online_*` / `en_ligne_*` sont de la visio synchrone :
 * elles comptent comme du présentiel (plafond 900 €), pas comme e-learning.
 */
export function isElearningModality(modality: string | null | undefined): boolean {
  const m = (modality || "").trim().toLowerCase();
  if (!m) return false;
  return (
    m === "elearning" ||
    m === "e_learning" ||
    m === "e-learning" ||
    m === "asynchrone" ||
    m === "async"
  );
}

export function microPercentFromCfpContribution(contributionEur: number): number | null {
  if (!Number.isFinite(contributionEur) || contributionEur < 1) return null;
  for (const bracket of FIFPL_MICRO_CFP_BRACKETS) {
    if (contributionEur < bracket.minEur) continue;
    if (bracket.maxEur == null || contributionEur <= bracket.maxEur) {
      return bracket.percent;
    }
  }
  return null;
}

export function rightsPercentForStatus(
  status: FifplProfessionalStatus,
  cfpContributionEur: number | null
): number | null {
  if (status === "independant") return 100;
  if (cfpContributionEur == null) return null;
  return microPercentFromCfpContribution(cfpContributionEur);
}

/**
 * Estimation des droits selon les critères Moniteurs de ski 2026.
 * Langues étrangères = cœur de métier (900 € / an, 300 € / jour).
 */
export function estimateFifplRights(input: {
  status: FifplProfessionalStatus | null;
  cfpContributionEur: number | null;
  modality?: string | null;
  alreadyCoveredEur?: number | null;
  /** Tarif formation (€) — pour estimer la prise en charge sur ce stage. */
  coursePriceEur?: number | null;
}): FifplRightsEstimate | null {
  if (!input.status) return null;
  let percent = rightsPercentForStatus(input.status, input.cfpContributionEur);
  let isProvisionalMicroEstimate = false;
  if (percent == null && input.status === "micro_entrepreneur") {
    percent = 20;
    isProvisionalMicroEstimate = true;
  }
  if (percent == null) return null;

  const elearning = isElearningModality(input.modality);
  const annualBase = elearning
    ? FIFPL_ANNUAL_CEILING_EUR * FIFPL_ELEARNING_FACTOR
    : FIFPL_ANNUAL_CEILING_EUR;
  const dailyBase = elearning
    ? FIFPL_DAILY_CEILING_EUR * FIFPL_ELEARNING_FACTOR
    : FIFPL_DAILY_CEILING_EUR;

  const gross = Math.round((annualBase * percent) / 100);
  const already = Math.max(0, Number(input.alreadyCoveredEur) || 0);
  const remaining = Math.max(0, gross - already);

  const coursePrice =
    input.coursePriceEur != null && Number.isFinite(input.coursePriceEur) && input.coursePriceEur > 0
      ? Number(input.coursePriceEur)
      : null;
  const coveredOnCourseEur =
    coursePrice != null ? Math.min(coursePrice, remaining) : null;
  const remainingChargeEur =
    coursePrice != null && coveredOnCourseEur != null
      ? Math.max(0, Math.round(coursePrice - coveredOnCourseEur))
      : null;

  return {
    criteriaYear: FIFPL_CRITERIA_YEAR,
    annualCeilingBaseEur: annualBase,
    isElearning: elearning,
    rightsPercent: percent,
    grossRightsEur: gross,
    alreadyCoveredEur: already,
    remainingRightsEur: remaining,
    dailyCeilingEur: dailyBase,
    isProvisionalMicroEstimate,
    coveredOnCourseEur,
    remainingChargeEur,
  };
}

/**
 * Extrait année et montant cotisation depuis le texte d'une attestation CFP URSSAF.
 */
export function parseCfpAttestationText(text: string): {
  year: number | null;
  contributionEur: number | null;
  suggestedStatus: FifplProfessionalStatus | null;
  warnings: string[];
} {
  const warnings: string[] = [];
  const normalized = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  let year: number | null = null;
  const yearPatterns = [
    /exercice\s*(?:de\s*)?(?:l['’]année\s*)?(20\d{2})/i,
    /ann[ée]e\s*(?:de\s*)?(?:cotisation|contribution)?\s*:?\s*(20\d{2})/i,
    /attestation[^\d]{0,40}(20\d{2})/i,
    /\b(20\d{2})\b/,
  ];
  for (const re of yearPatterns) {
    const m = normalized.match(re);
    if (m) {
      year = Number(m[1]);
      break;
    }
  }
  if (year == null) {
    warnings.push("Année de l’attestation introuvable dans le PDF — saisissez-la manuellement.");
  } else if (!isAcceptedCfpAttestationYear(year)) {
    warnings.push(
      `L’attestation semble dater de ${year}. Attendu : ${formatAcceptedCfpAttestationYears()} — téléchargez l’attestation CFP depuis votre espace URSSAF.`
    );
  }

  let contributionEur: number | null = null;
  const amountPatterns = [
    /cotisation[^\d]{0,40}(\d+[.,]\d{2}|\d+)\s*€/i,
    /contribution[^\d]{0,50}(\d+[.,]\d{2}|\d+)\s*€/i,
    /montant[^\d]{0,30}(\d+[.,]\d{2}|\d+)\s*€/i,
    /(\d+[.,]\d{2}|\d+)\s*€[^\n]{0,40}cotisation/i,
  ];
  for (const re of amountPatterns) {
    const m = normalized.match(re);
    if (m) {
      contributionEur = Number(m[1].replace(",", "."));
      break;
    }
  }
  if (contributionEur == null) {
    warnings.push(
      "Montant de cotisation CFP introuvable dans le PDF — saisissez-le manuellement (nécessaire pour les micro-entrepreneurs)."
    );
  }

  let suggestedStatus: FifplProfessionalStatus | null = null;
  if (/micro[- ]?entrepreneur/i.test(lower) || /\bmei\b/.test(lower) || /auto[- ]?entrepreneur/i.test(lower)) {
    suggestedStatus = "micro_entrepreneur";
  } else if (/ind[ée]pendant/i.test(lower) || /travailleur\s+ind[ée]pendant/i.test(lower)) {
    suggestedStatus = "independant";
  }

  return { year, contributionEur, suggestedStatus, warnings };
}

export function validateFifplQuestionnaire(q: FifplQuestionnaire): string | null {
  if (!q.status) {
    return "Indiquez si vous êtes indépendant ou micro-entrepreneur.";
  }
  // Attestation facultative : si un fichier est joint, l'année doit être acceptée (critères ou N-1).
  const hasAttestation = Boolean(q.cfpAttestationPath || q.cfpAttestationFileName);
  if (hasAttestation) {
    if (q.cfpAttestationYear == null) {
      return `Indiquez l’année de l’attestation CFP (attendu : ${formatAcceptedCfpAttestationYears()}).`;
    }
    if (!isAcceptedCfpAttestationYear(q.cfpAttestationYear)) {
      return `L’attestation doit dater de ${formatAcceptedCfpAttestationYears()}. Téléchargez-la depuis votre espace URSSAF.`;
    }
  }
  if (q.status === "micro_entrepreneur") {
    if (q.cfpContributionEur == null || !(q.cfpContributionEur >= 1)) {
      return "Indiquez le montant de votre cotisation CFP (micro-entrepreneur) pour estimer vos droits.";
    }
  }
  if (q.hadOtherFifplTrainingThisYear === null) {
    return `Indiquez si vous avez déjà bénéficié d’une prise en charge FIFPL en ${FIFPL_CRITERIA_YEAR}.`;
  }
  if (q.hadOtherFifplTrainingThisYear === true) {
    if (
      q.otherFifplAmountAlreadyCoveredEur == null ||
      !Number.isFinite(q.otherFifplAmountAlreadyCoveredEur) ||
      q.otherFifplAmountAlreadyCoveredEur < 0
    ) {
      return "Indiquez le montant déjà pris en charge par le FIFPL pour cette autre formation.";
    }
  }
  return null;
}

export function formatFifplQuestionnaireSummary(
  q: FifplQuestionnaire,
  rights: FifplRightsEstimate | null
): string {
  const lines = [
    `Financement FIFPL ${FIFPL_CRITERIA_YEAR} — estimation selon critères Moniteurs de ski (8551 Z).`,
  ];
  if (q.status === "independant") lines.push("Statut : indépendant (100 % des critères).");
  if (q.status === "micro_entrepreneur") {
    lines.push(
      `Statut : micro-entrepreneur — cotisation CFP ${q.cfpContributionEur ?? "?"} € → ${rights?.rightsPercent ?? "?"} % des critères` +
        (rights?.isProvisionalMicroEstimate ? " (estimation provisoire 20 %)" : "") +
        "."
    );
  }
  if (q.cfpAttestationFileName) {
    lines.push(
      `Attestation CFP : ${q.cfpAttestationFileName}` +
        (q.cfpAttestationYear != null ? ` (${q.cfpAttestationYear})` : "")
    );
  } else {
    lines.push("Attestation CFP : non jointe.");
  }
  if (q.cfpAttestationPath) {
    lines.push(`Stockage : ${q.cfpAttestationPath}`);
  }
  if (q.hadOtherFifplTrainingThisYear === true) {
    lines.push(
      `Autre formation FIFPL ${FIFPL_CRITERIA_YEAR} : oui — montant déjà pris en charge ${q.otherFifplAmountAlreadyCoveredEur ?? 0} € (déduit du plafond annuel).`
    );
  } else if (q.hadOtherFifplTrainingThisYear === false) {
    lines.push(`Autre formation FIFPL ${FIFPL_CRITERIA_YEAR} : non`);
  }
  if (rights) {
    lines.push(
      `Droits estimés : plafond ${rights.annualCeilingBaseEur} € × ${rights.rightsPercent} % = ${rights.grossRightsEur} € bruts · reste ${rights.remainingRightsEur} €` +
        (rights.isElearning ? " (e-learning : 50 % des critères)" : "") +
        " — indicatif, seul l’accord du FIFPL fait foi."
    );
    if (rights.coveredOnCourseEur != null && rights.remainingChargeEur != null) {
      lines.push(
        `Sur cette formation : prise en charge estimée ${rights.coveredOnCourseEur} € · reste à charge estimé ${rights.remainingChargeEur} €.`
      );
    }
  }
  if (q.parseWarnings.length) {
    lines.push(`Alertes parseur : ${q.parseWarnings.join(" · ")}`);
  }
  return lines.join("\n");
}

export const FIFPL_REGISTER_COPY = {
  fundingChoiceHelp:
    "Prise en charge FIFPL (moniteurs de ski) — estimation des droits selon les critères 2026.",
  sectionTitle: "Droits FIFPL",
  sectionDescription: `Si vous le souhaitez, nous pouvons vous aider à estimer vos droits FIFPL ${FIFPL_CRITERIA_YEAR} selon les critères Moniteurs de ski (8551 Z) : plafond annuel 900 € pour les langues (cœur de métier), proportionnel à la cotisation CFP pour les micro-entrepreneurs. L’attestation CFP URSSAF est facultative à ce stade.`,
  urssafHint:
    "Attestation CFP (facultatif) : espace URSSAF → documents / attestations → attestation de contribution à la formation professionnelle (CFP).",
  attestationUploadLabel: `Attestation CFP URSSAF ${FIFPL_CRITERIA_YEAR} (facultatif)`,
  attestationUploadHelp:
    "PDF ou image si vous l’avez sous la main. Nous lisons l’année et, si possible, le montant de cotisation ; vous pourrez corriger les valeurs.",
  statusLabel: "Votre statut professionnel",
  statusIndependant: "Indépendant — 100 % des critères FIFPL",
  statusMicro: "Micro-entrepreneur — selon la cotisation CFP",
  contributionHelp:
    "Montant de cotisation CFP figurant sur votre attestation URSSAF (grille micro-entrepreneurs des critères 2026).",
  otherTrainingLabel: `Avez-vous déjà bénéficié d’une prise en charge FIFPL pour une autre formation en ${FIFPL_CRITERIA_YEAR} ?`,
  otherTrainingHelp:
    "Si oui, indiquez le montant déjà pris en charge : il sera déduit du plafond annuel (900 € pour les formations FLI, y compris en visio).",
  alreadyCoveredLabel: "Montant déjà pris en charge par le FIFPL (€)",
  estimateDisclaimer:
    "Estimation selon les critères FIFPL Moniteurs de ski 2026 — seul l’accord du FIFPL fait foi. Les formations FLI en ligne (visio synchrone) sont considérées comme du présentiel pour le FIFPL ; le plafond e-learning 50 % ne s’applique qu’à l’asynchrone. Sur votre demande FIFPL, cochez « présentiel ». FLI est exonérée de TVA : HT = TTC.",
  confirmationAlert: (remainingEur: number | null) =>
    remainingEur == null
      ? `Financement FIFPL ${FIFPL_CRITERIA_YEAR}. Les frais de dossier restent dus à l’inscription.`
      : `Financement FIFPL ${FIFPL_CRITERIA_YEAR} : droits restants estimés à ${remainingEur} € (après déduction des prises en charge déjà accordées). Les frais de dossier restent dus à l’inscription.`,
} as const;

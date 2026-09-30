/**
 * FIFPL — moniteurs de ski 2026 (critères profession 8551 Z).
 *
 * Source : « Critères de prise en charge Moniteurs de ski 2026.pdf »
 * - Plafond annuel cœur de métier : 900 € (langues étrangères = cœur de métier)
 * - Indépendants : 100 % des critères
 * - Micro-entrepreneurs : % selon cotisation CFP (tableau page 3)
 * - E-learning : 50 % des critères journaliers et annuels
 * - Autre formation FIFPL déjà prise en charge cette année : déduite des droits
 */

export const FIFPL_CRITERIA_YEAR = 2026;

/** Plafond annuel formations cœur de métier (langues = cœur de métier). */
export const FIFPL_ANNUAL_CEILING_EUR = 900;

/** Plafond journalier cœur de métier. */
export const FIFPL_DAILY_CEILING_EUR = 300;

/** E-learning : 50 % des critères annuels / journaliers. */
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
  /**
   * true = dépôt maintenant ; false = plus tard (facultatif à l'inscription) ;
   * null = pas encore choisi.
   */
  provideCfpAttestation: boolean | null;
  /** Année de l'attestation CFP URSSAF (attendue : année des critères). */
  cfpAttestationYear: number | null;
  /** Montant de cotisation CFP lu / saisi (€). Utile pour les micro. */
  cfpContributionEur: number | null;
  /** Chemin storage après upload (bucket documents). */
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
  provideCfpAttestation: null,
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
  annualCeilingBaseEur: number;
  isElearning: boolean;
  rightsPercent: number;
  grossRightsEur: number;
  alreadyCoveredEur: number;
  remainingRightsEur: number;
  dailyCeilingEur: number;
  /** true si micro sans cotisation → pire cas 20 % (à confirmer avec l'attestation). */
  isProvisionalMicroEstimate: boolean;
}

export function isElearningModality(modality: string | null | undefined): boolean {
  const m = (modality || "").trim();
  return m === "online_individual" || m === "online_group" || m === "en_ligne_individuel" || m === "en_ligne_groupe";
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

export function estimateFifplRights(input: {
  status: FifplProfessionalStatus | null;
  cfpContributionEur: number | null;
  modality?: string | null;
  alreadyCoveredEur?: number | null;
}): FifplRightsEstimate | null {
  if (!input.status) return null;
  let percent = rightsPercentForStatus(input.status, input.cfpContributionEur);
  let isProvisionalMicroEstimate = false;
  // Micro sans cotisation : pire cas 20 % (SESSIONS §3.2), à confirmer avec l'attestation.
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
  };
}

/**
 * Extrait année et montant cotisation depuis le texte d'une attestation CFP URSSAF.
 * Heuristiques tolérantes : les modèles URSSAF varient.
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
  } else if (year !== FIFPL_CRITERIA_YEAR) {
    warnings.push(
      `L’attestation semble dater de ${year}. Pour ${FIFPL_CRITERIA_YEAR}, téléchargez l’attestation CFP ${FIFPL_CRITERIA_YEAR} depuis votre espace URSSAF.`
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
      "Montant de cotisation CFP introuvable dans le PDF — saisissez-le manuellement (obligatoire pour les micro-entrepreneurs)."
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
  if (q.provideCfpAttestation !== true && q.provideCfpAttestation !== false) {
    return "Indiquez si vous déposez votre attestation CFP maintenant ou plus tard.";
  }
  if (q.provideCfpAttestation === true) {
    if (!q.cfpAttestationPath && !q.cfpAttestationFileName) {
      return "Déposez votre attestation CFP (PDF ou image), ou choisissez de la fournir plus tard.";
    }
    if (q.cfpAttestationYear == null) {
      return `Indiquez l’année de l’attestation CFP (attendu : ${FIFPL_CRITERIA_YEAR}).`;
    }
    if (q.cfpAttestationYear !== FIFPL_CRITERIA_YEAR) {
      return `L’attestation doit dater de ${FIFPL_CRITERIA_YEAR}. Téléchargez-la depuis votre espace URSSAF.`;
    }
  }
  if (!q.status) {
    return "Indiquez si vous êtes indépendant ou micro-entrepreneur.";
  }
  // Cotisation CFP : obligatoire seulement si attestation déposée + micro.
  if (
    q.provideCfpAttestation === true &&
    q.status === "micro_entrepreneur" &&
    (q.cfpContributionEur == null || !(q.cfpContributionEur >= 1))
  ) {
    return "Indiquez le montant de votre cotisation CFP (micro-entrepreneur).";
  }
  if (q.hadOtherFifplTrainingThisYear === null) {
    return `Indiquez si vous avez déjà suivi une formation prise en charge par le FIFPL en ${FIFPL_CRITERIA_YEAR}.`;
  }
  if (q.hadOtherFifplTrainingThisYear) {
    if (
      q.otherFifplAmountAlreadyCoveredEur == null ||
      !(q.otherFifplAmountAlreadyCoveredEur >= 0)
    ) {
      return "Indiquez le montant déjà pris en charge par le FIFPL cette année.";
    }
  }
  return null;
}

export function formatFifplQuestionnaireSummary(
  q: FifplQuestionnaire,
  rights: FifplRightsEstimate | null
): string {
  const lines = [
    `Financement FIFPL ${FIFPL_CRITERIA_YEAR} — estimation des droits` +
      (q.provideCfpAttestation === false
        ? " (attestation CFP à fournir plus tard)."
        : " — attestation CFP URSSAF."),
  ];
  if (q.provideCfpAttestation === true) {
    lines.push("Attestation CFP : déposée à l’inscription.");
  } else if (q.provideCfpAttestation === false) {
    lines.push("Attestation CFP : non jointe — le stagiaire la fournira plus tard.");
  }
  if (q.status === "independant") lines.push("Statut : indépendant (100 % des critères).");
  if (q.status === "micro_entrepreneur") {
    lines.push(
      `Statut : micro-entrepreneur — cotisation CFP ${q.cfpContributionEur ?? "non renseignée"} € → ${rights?.rightsPercent ?? "?"} % des critères` +
        (rights?.isProvisionalMicroEstimate ? " (estimation provisoire 20 %)" : "") +
        "."
    );
  }
  if (q.cfpAttestationYear != null) {
    lines.push(`Attestation CFP année : ${q.cfpAttestationYear}`);
  }
  if (q.cfpAttestationFileName) {
    lines.push(`Fichier : ${q.cfpAttestationFileName}`);
  }
  if (q.cfpAttestationPath) {
    lines.push(`Stockage : ${q.cfpAttestationPath}`);
  }
  if (q.hadOtherFifplTrainingThisYear === true) {
    lines.push(
      `Autre formation FIFPL ${FIFPL_CRITERIA_YEAR} : oui — déjà pris en charge ${q.otherFifplAmountAlreadyCoveredEur ?? 0} € (déduit des droits).`
    );
  } else if (q.hadOtherFifplTrainingThisYear === false) {
    lines.push(`Autre formation FIFPL ${FIFPL_CRITERIA_YEAR} : non`);
  }
  if (rights) {
    lines.push(
      `Droits estimés : ${rights.grossRightsEur} € bruts · reste ${rights.remainingRightsEur} €` +
        (rights.isElearning ? " (plafond e-learning 50 %)" : "") +
        " — indicatif, seul l’accord du FIFPL fait foi."
    );
  }
  if (q.parseWarnings.length) {
    lines.push(`Alertes parseur : ${q.parseWarnings.join(" · ")}`);
  }
  return lines.join("\n");
}

export const FIFPL_REGISTER_COPY = {
  fundingChoiceHelp:
    "Prise en charge FIFPL (moniteurs de ski). Vous pourrez joindre votre attestation CFP maintenant ou plus tard.",
  sectionTitle: "Droits FIFPL et attestation CFP",
  sectionDescription: `Si vous le souhaitez, nous pouvons vous aider à estimer vos droits FIFPL ${FIFPL_CRITERIA_YEAR} à partir de votre statut (indépendant ou micro-entrepreneur). L’attestation de contribution à la formation professionnelle (CFP), téléchargeable depuis votre espace URSSAF, permet de confirmer ces éléments — notamment le montant de cotisation pour les micro-entrepreneurs. Vous pouvez la déposer maintenant ou la fournir plus tard ; un rappel vous sera envoyé si elle manque.`,
  urssafHint:
    "Où la trouver : espace URSSAF → documents / attestations → attestation de contribution à la formation professionnelle (CFP).",
  provideChoiceLabel: "Souhaitez-vous déposer votre attestation CFP maintenant ?",
  provideNowLabel: "Oui, je la dépose maintenant",
  provideLaterLabel: "Non, je la fournirai plus tard",
  provideLaterHelp:
    "Vous pourrez l’envoyer ensuite. FLI pourra vous relancer. Sans attestation, l’estimation des droits reste indicative — seul l’accord du FIFPL fait foi.",
  attestationUploadLabel: `Attestation CFP URSSAF ${FIFPL_CRITERIA_YEAR}`,
  attestationUploadHelp:
    "PDF ou image. Nous lisons l’année et, si possible, le montant de cotisation ; vous pourrez corriger les valeurs.",
  statusLabel: "Votre statut professionnel",
  statusIndependant: "Indépendant — 100 % des critères FIFPL",
  statusMicro: "Micro-entrepreneur — selon la cotisation CFP",
  contributionHelp:
    "Pour les micro-entrepreneurs : indiquez le montant figurant sur l’attestation. Sans montant, l’estimation utilise le pire cas (20 %), à confirmer ensuite.",
  otherTrainingLabel: `Avez-vous déjà suivi une autre formation prise en charge par le FIFPL en ${FIFPL_CRITERIA_YEAR} ?`,
  otherTrainingHelp:
    "Le montant déjà pris en charge sera déduit du montant total de vos droits FIFPL pour l’année.",
  alreadyCoveredLabel: "Montant déjà pris en charge cette année (€)",
  estimateDisclaimer:
    "Montants indicatifs — seul l’accord du FIFPL fait foi. Formation en ligne synchrone : sur votre demande FIFPL, cochez « présentiel » (conseil du FIFPL). FLI est exonérée de TVA : HT = TTC.",
  confirmationAlert: (remainingEur: number | null, attestationDeferred?: boolean) => {
    const base =
      remainingEur == null
        ? `Financement FIFPL ${FIFPL_CRITERIA_YEAR}.`
        : `Financement FIFPL ${FIFPL_CRITERIA_YEAR} : droits restants estimés à ${remainingEur} € (après déduction des prises en charge déjà accordées).`;
    const att = attestationDeferred
      ? " Attestation CFP à fournir plus tard."
      : " Attestation CFP jointe ou en cours de traitement.";
    return `${base}${att} Les frais de dossier restent dus à l’inscription.`;
  },
} as const;

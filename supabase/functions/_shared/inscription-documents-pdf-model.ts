/**
 * Modèle des PDF Convention + Programme (dossier d'inscription FIF-PL).
 * Aligné sur src/lib/inscription-documents-pdf.ts.
 */

import {
  CONDITIONS_GENERALES_PROVENANCE,
  CONDITIONS_GENERALES_SECTIONS,
  CONDITIONS_GENERALES_TITLE,
} from "./conditions-generales-content.ts";
import {
  fliDocumentFooterLines,
  formatOrganizationAddress,
  organizationLegalMentions,
  parseOrganizationIdentity,
  type OrganizationIdentity,
} from "./organization-identity.ts";

export type InscriptionDocumentsStudent = {
  civility?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

export type InscriptionDocumentsRow = {
  code?: string | null;
  language?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  dates_to_confirm?: boolean | null;
  duration_hours?: number | string | null;
  course_location?: string | null;
  modality?: string | null;
  price?: number | string | null;
  deposit_amount?: number | string | null;
  balance_after_deposit?: number | string | null;
  group_size?: number | string | null;
  funding_organization?: string | null;
  payment_method?: string | null;
};

export type InscriptionDocumentPdfModel = {
  kind: "convention" | "programme";
  title: string;
  generatedAtLabel: string;
  inscriptionCode: string;
  studentDisplayName: string;
  studentCivility: string;
  studentAddressLines: string[];
  studentEmail: string;
  studentPhone: string;
  studentCompany: string;
  language: string;
  startDateLabel: string;
  endDateLabel: string;
  datesLabel: string;
  durationHoursLabel: string;
  locationLabel: string;
  modalityLabel: string;
  groupSizeLabel: string;
  priceLabel: string;
  depositLabel: string;
  balanceLabel: string;
  fundingLabel: string;
  paymentTermsLabel: string;
  organization: OrganizationIdentity;
  organizationAddress: string;
  organizationLegalLines: string[];
  /** Pied de page légal (Version 4) en bas du document. */
  documentFooterLines: string[];
  sections: Array<{ title: string; paragraphs: string[] }>;
  footerNote: string;
};

function texte(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    // YYYY-MM-DD sans timezone
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(
        "fr-FR",
        { day: "numeric", month: "long", year: "numeric" }
      );
    }
    return iso;
  }
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEuros(amount: number | string | null | undefined): string {
  const n = asNumber(amount);
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function normalizeCivility(value: string | null | undefined): string {
  const raw = texte(value).toLowerCase();
  if (!raw) return "";
  if (raw === "madame" || raw === "mme" || raw === "mlle" || raw === "mademoiselle") {
    return "Mme";
  }
  if (raw === "monsieur" || raw === "m." || raw === "mr" || raw === "m") {
    return "M.";
  }
  return texte(value);
}

function paymentMethodLabelFr(method: string | null | undefined): string {
  const m = (method || "").toLowerCase();
  if (m.includes("virement")) return "virement bancaire";
  if (m.includes("cheque") || m.includes("chèque")) return "chèque";
  if (m.includes("stripe") || m.includes("carte")) return "carte bancaire";
  if (m.includes("especes") || m.includes("espèces")) return "espèces";
  return method?.trim() || "selon les modalités convenues";
}

function buildDatesLabel(input: {
  start_date?: string | null;
  end_date?: string | null;
  dates_to_confirm?: boolean | null;
}): { startDateLabel: string; endDateLabel: string; datesLabel: string } {
  const startDateLabel = formatDateFr(input.start_date);
  const endDateLabel = formatDateFr(input.end_date);
  if (input.dates_to_confirm) {
    const wished = startDateLabel !== "—" ? startDateLabel : endDateLabel;
    const datesLabel =
      wished !== "—"
        ? `À planifier — début souhaité le ${wished}`
        : "À planifier";
    return { startDateLabel: datesLabel, endDateLabel: datesLabel, datesLabel };
  }
  if (startDateLabel === endDateLabel) {
    return {
      startDateLabel,
      endDateLabel,
      datesLabel: startDateLabel,
    };
  }
  return {
    startDateLabel,
    endDateLabel,
    datesLabel: `du ${startDateLabel} au ${endDateLabel}`,
  };
}

function buildPaymentTermsLabel(input: {
  priceLabel: string;
  depositLabel: string;
  balanceLabel: string;
  payment_method?: string | null;
  fundingLabel: string;
}): string {
  const method = paymentMethodLabelFr(input.payment_method);
  const parts = [
    `Coût pédagogique total : ${input.priceLabel}.`,
    `Frais de dossier / acompte : ${input.depositLabel} (mode : ${method}).`,
    `Solde : ${input.balanceLabel}.`,
  ];
  if (input.fundingLabel && input.fundingLabel !== "—") {
    parts.push(`Financement : ${input.fundingLabel}.`);
  }
  if ((input.payment_method || "").toLowerCase().includes("virement")) {
    parts.push(
      "Le solde peut être réglé par chèque à l'inscription, encaissé après clôture du dossier, sauf paiement intégral."
    );
  }
  return parts.join(" ");
}

function modalityLabelFr(modality: string | null | undefined): string {
  const m = (modality || "").toLowerCase();
  if (m.includes("presentiel") || m.includes("présentiel")) return "Présentiel";
  if (m.includes("en_ligne_individuel") || m.includes("individuel")) {
    return "En ligne — cours individuel";
  }
  if (m.includes("en_ligne_groupe") || m.includes("groupe")) {
    return "En ligne — petit groupe";
  }
  if (m.includes("mixte")) return "Mixte";
  return modality?.trim() || "—";
}

export function isOnlineModality(modality: string | null | undefined): boolean {
  const m = (modality || "").toLowerCase();
  return (
    m.includes("en_ligne") ||
    m.includes("e-learning") ||
    m.includes("distanciel") ||
    m.includes("online")
  );
}

/** Articles de la convention « formations en ligne » (texte Paula, Version 4). */
export function buildOnlineConventionSections(input: {
  language: string;
  datesLabel: string;
  durationHoursLabel: string;
  groupSizeLabel: string;
  studentAddressLines: string[];
  pedagogicalContact: string;
  paymentTermsLabel: string;
}): Array<{ title: string; paragraphs: string[] }> {
  const language = input.language || "la langue choisie";
  const addressHint = input.studentAddressLines.join(" ").trim();
  const lieu = addressHint
    ? `formation en ligne — ${addressHint}`
    : "formation en ligne";
  const contact = input.pedagogicalContact || "Paula Rangel-Halbwachs";

  return [
    {
      title: "Article I : Objet",
      paragraphs: [
        `En exécution du présent contrat, F.L.I. s'engage à organiser l'action de formation suivante : formation individualisée ${language}.`,
      ],
    },
    {
      title: "Article II : Nature et caractéristique des actions de formation",
      paragraphs: [
        "L'action de formation entre dans la catégorie des actions d'acquisition et de perfectionnement des connaissances prévue à l'article L.6313-1 du code du travail.",
        `L'objectif de la formation est de permettre au stagiaire de développer les bases en ${language} afin de pouvoir communiquer avec la clientèle étrangère dans le cadre de son activité professionnelle.`,
        "À l'issue de la formation une attestation de stage sera délivrée au stagiaire.",
        "Le programme du stage est joint à la présente convention.",
      ],
    },
    {
      title: "Article III : Niveau de connaissances préalables nécessaire",
      paragraphs: ["Avoir des notions dans la langue."],
    },
    {
      title: "Article IV : Organisation de l'action de formation",
      paragraphs: [
        `Lieu de la formation : ${lieu}.`,
        `Dates de la formation : ${input.datesLabel}.`,
        `Durée du pack : ${input.durationHoursLabel}.`,
        "Horaires : à définir en fonction de vos disponibilités et celles du professeur.",
        `Effectif : ${input.groupSizeLabel}.`,
      ],
    },
    {
      title: "Article V : Prix et modalités de règlement",
      paragraphs: [input.paymentTermsLabel],
    },
    {
      title: "Description des équipements",
      paragraphs: [
        "Le stagiaire devra disposer :",
        "• d'un ordinateur équipé d'une Webcam,",
        "• d'une connexion internet haut débit,",
        "• d'un casque ou enceintes et microphone,",
        "• d'un compte zoom.us — gratuit.",
      ],
    },
    {
      title: "Moyens pédagogiques et de suivi",
      paragraphs: [
        "• cours en face à face en ligne avec le formateur via notre plateforme www.zoom.us,",
        "• remise d'un fascicule support de cours,",
        "• exercices en ligne,",
        "• mise en situation,",
        "• travaux d'écoute et de compréhension orale (support audio fourni).",
        "Évaluation en continue de la progression via des exercices écrits et oraux adaptés aux besoins de l'apprenant.",
        `Personne assurant le suivi pédagogique : ${contact}.`,
      ],
    },
    {
      title: "Réservation des cours",
      paragraphs: [
        "L'apprenant réservera ses cours en ligne directement avec le formateur par téléphone ou e-mail.",
        "Pour les cours en ligne réservés auprès de nos formateurs, le stagiaire dispose d'un délai d'annulation de minimum 24 h. En cas de non-respect du délai, ou d'absence lors d'un cours, le cours sera facturé.",
      ],
    },
  ];
}

function studentFullName(student: InscriptionDocumentsStudent): string {
  return [texte(student.first_name), texte(student.last_name)].filter(Boolean).join(" ");
}

function studentAddressLines(student: InscriptionDocumentsStudent): string[] {
  const lines: string[] = [];
  if (texte(student.street_address)) lines.push(texte(student.street_address));
  const ville = [texte(student.postal_code), texte(student.city)].filter(Boolean).join(" ");
  if (ville) lines.push(ville);
  return lines;
}

function balanceAmount(row: InscriptionDocumentsRow): number | null {
  const balance = asNumber(row.balance_after_deposit);
  if (balance != null) return balance;
  const price = asNumber(row.price);
  if (price == null) return null;
  const deposit = asNumber(row.deposit_amount) ?? 0;
  return price - deposit;
}

const PROGRAMME_SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: "Objectifs",
    paragraphs: [
      "Acquérir et perfectionner les compétences linguistiques nécessaires à l'exercice professionnel en station et auprès de la clientèle internationale.",
      "Développer la compréhension et l'expression orales, le lexique technique du ski et des services, et la capacité à gérer des situations de communication authentiques.",
    ],
  },
  {
    title: "Contenu pédagogique",
    paragraphs: [
      "Compréhension orale : consignes, briefings, échanges avec la clientèle.",
      "Expression orale : accueil, conseils techniques, gestion d'incidents, petite conversation.",
      "Lexique professionnel : matériel, sécurité, conditions de neige, services de la station.",
      "Mise en situation : jeux de rôle et scénarios adaptés au métier du stagiaire.",
    ],
  },
  {
    title: "Modalités pédagogiques",
    paragraphs: [
      "Formation en présentiel en station ou à distance selon la modalité retenue à l'inscription.",
      "Groupes constitués selon le niveau constaté au test d'entrée ; rythme adapté à la durée prévue.",
      "Évaluation formative continue et bilan de fin de formation.",
    ],
  },
  {
    title: "Moyens mis à disposition",
    paragraphs: [
      "Formateur·rice qualifié·e, supports de cours, accès aux ressources FLI pendant la session.",
      "Feuille d'émargement et attestation de suivi remises à l'issue de la formation.",
    ],
  },
];

/**
 * Programme « formation individualisée en ligne » — texte Paula (Version 2).
 * Placeholders «Langue» / durée remplacés à l'appel.
 */
export function buildOnlineProgrammeSections(input: {
  language: string;
  durationHoursLabel: string;
}): Array<{ title: string; paragraphs: string[] }> {
  const language = input.language || "la langue choisie";
  const duree = input.durationHoursLabel || "—";
  return [
    {
      title: "Objectifs",
      paragraphs: [
        "Les objectifs de cette formation sont de :",
        "• Développer les compétences en communication orale.",
        "• Améliorer les capacités de compréhension.",
        "• Enrichir les connaissances lexicales courantes et relatives à l'enseignement du ski.",
        "• Consolider les connaissances grammaticales et lexicales.",
      ],
    },
    {
      title: "Méthode et contenu",
      paragraphs: [
        "• Parcours personnalisé adapté à votre niveau et à vos besoins spécifiques.",
        "• Travail en face à face pédagogique via Google Meet.",
        `• Exercices de compréhension et d'expression en ${language}.`,
        "• Support de cours fourni.",
        "• Matériel nécessaire : un ordinateur avec Webcam, casque, microphone et une connexion internet haut débit.",
      ],
    },
    {
      title: "Durée",
      paragraphs: [`${duree}.`],
    },
    {
      title: "Déroulement d'un cours",
      paragraphs: [
        "• Vérification des acquis et corrections des exercices.",
        "• Cours théorique spécifique et pratique afin de permettre la pratique du langage propre à votre profession.",
        "• Jeux de rôles adaptés à votre profession et à votre niveau.",
        "• Utilisation de tout autre moyen audio ou audio-visuel que le professeur estimera nécessaire.",
        "• Cours pour l'acquisition des structures grammaticales de bases et du vocabulaire commun au milieu montagne ; ainsi que le vocabulaire technique professionnel.",
      ],
    },
    {
      title: "Contenu prévisionnel",
      paragraphs: [
        "Ce stage va permettre au stagiaire d'utiliser entre autres les fonctions langagières suivantes :",
        "• Bases linguistiques.",
        "• Grammaire (conjugaison, syntaxe de la langue apprise, etc.).",
        "• Expression orale – donner des informations et instructions précises et brèves.",
        "• Expression écrite – les outils pour une communication écrite – mail et texto – efficace avec vos clients.",
        "• Compréhension écrite – comprendre des textes courts et simples et de reconnaître les idées principales d'un contenu.",
        "• Compréhension orale – comprendre des informations, questions et instructions précises et brèves.",
        "• Les composants culturels pouvant aider à une meilleure communication avec la clientèle étrangère.",
        "Ceci est un contenu prévisionnel qui sera réajusté tout au long de la formation en fonction de votre niveau, progression et de vos besoins.",
      ],
    },
  ];
}

export function buildConventionPdfModel(input: {
  inscription: InscriptionDocumentsRow;
  student: InscriptionDocumentsStudent;
  identity: unknown;
  generatedAt?: Date;
}): InscriptionDocumentPdfModel {
  const organization = parseOrganizationIdentity(input.identity);
  const generatedAt = input.generatedAt ?? new Date();
  const name = studentFullName(input.student) || "Stagiaire";
  const language = texte(input.inscription.language) || "—";
  const { startDateLabel, endDateLabel, datesLabel } = buildDatesLabel(
    input.inscription
  );
  const hours = asNumber(input.inscription.duration_hours);
  const durationHoursLabel = hours != null ? `${hours} heures` : "—";
  const addressLines = studentAddressLines(input.student);
  const groupSizeLabel = String(input.inscription.group_size ?? 1);
  const online = isOnlineModality(input.inscription.modality);
  const civility = normalizeCivility(input.student.civility);
  const priceLabel = formatEuros(input.inscription.price);
  const depositLabel = formatEuros(input.inscription.deposit_amount);
  const balanceLabel = formatEuros(balanceAmount(input.inscription));
  const fundingLabel = texte(input.inscription.funding_organization) || "—";
  const paymentTermsLabel = buildPaymentTermsLabel({
    priceLabel,
    depositLabel,
    balanceLabel,
    payment_method: input.inscription.payment_method,
    fundingLabel,
  });

  const sections = online
    ? [
        {
          title: "Entre les soussignés",
          paragraphs: [
            `1/ L'organisme de formation : ${organization.legal_name || "France Langues International"}, ${formatOrganizationAddress(organization) || "25 avenue de la gare, 73800 Montmélian"}${organization.siret ? `, Siret : ${organization.siret}` : ""}${organization.activity_number ? `, enregistré sous le n° de déclaration d'activité : ${organization.activity_number}` : ""}${organization.activity_authority ? ` auprès du ${organization.activity_authority}` : ""}${organization.representative ? `, représenté par ${organization.representative}` : ""}.`,
            `2/ L'entreprise ou le stagiaire : ${[civility, name].filter(Boolean).join(" ")}${addressLines.length ? `, ${addressLines.join(", ")}` : ""}${texte(input.student.company) ? ` (${texte(input.student.company)})` : ""}.`,
            "Est conclue la convention de formation professionnelle suivante.",
          ],
        },
        ...buildOnlineConventionSections({
          language,
          datesLabel,
          durationHoursLabel,
          groupSizeLabel,
          studentAddressLines: addressLines,
          pedagogicalContact:
            organization.representative || "Paula Rangel-Halbwachs",
          paymentTermsLabel,
        }),
      ]
    : [
        {
          title: "Objet",
          paragraphs: [
            `${organization.legal_name || "L'organisme de formation"} organise une action de formation professionnelle au bénéfice de ${name}.`,
            "L'action entre dans la catégorie des actions d'acquisition et de perfectionnement des connaissances prévue par l'article L.6313-1 du code du travail.",
          ],
        },
        {
          title: CONDITIONS_GENERALES_TITLE,
          paragraphs: [CONDITIONS_GENERALES_PROVENANCE],
        },
        ...CONDITIONS_GENERALES_SECTIONS.map((s) => ({
          title: s.title,
          paragraphs: s.paragraphs,
        })),
        {
          title: "Prix et modalités de règlement",
          paragraphs: [paymentTermsLabel],
        },
      ];

  return {
    kind: "convention",
    title: "Convention de formation professionnelle",
    generatedAtLabel: formatDateFr(generatedAt.toISOString()),
    inscriptionCode: texte(input.inscription.code) || "—",
    studentDisplayName: name,
    studentCivility: civility,
    studentAddressLines: addressLines,
    studentEmail: texte(input.student.email),
    studentPhone: texte(input.student.phone),
    studentCompany: texte(input.student.company),
    language,
    startDateLabel,
    endDateLabel,
    datesLabel,
    durationHoursLabel,
    locationLabel: texte(input.inscription.course_location) || "—",
    modalityLabel: modalityLabelFr(input.inscription.modality),
    groupSizeLabel,
    priceLabel,
    depositLabel,
    balanceLabel,
    fundingLabel,
    paymentTermsLabel,
    organization,
    organizationAddress: formatOrganizationAddress(organization),
    organizationLegalLines: organizationLegalMentions(organization),
    documentFooterLines: fliDocumentFooterLines(),
    sections,
    footerNote:
      "Document généré automatiquement à partir des données de l'inscription. La convention signée fait foi.",
  };
}

export function buildProgrammePdfModel(input: {
  inscription: InscriptionDocumentsRow;
  student: InscriptionDocumentsStudent;
  identity: unknown;
  generatedAt?: Date;
}): InscriptionDocumentPdfModel {
  const organization = parseOrganizationIdentity(input.identity);
  const generatedAt = input.generatedAt ?? new Date();
  const name = studentFullName(input.student) || "Stagiaire";
  const language = texte(input.inscription.language) || "la langue choisie";
  const { startDateLabel, endDateLabel, datesLabel } = buildDatesLabel(
    input.inscription
  );
  const hours = asNumber(input.inscription.duration_hours);
  const durationHoursLabel = hours != null ? `${hours} heures` : "—";
  const priceLabel = formatEuros(input.inscription.price);
  const depositLabel = formatEuros(input.inscription.deposit_amount);
  const balanceLabel = formatEuros(balanceAmount(input.inscription));
  const fundingLabel = texte(input.inscription.funding_organization) || "—";
  const addressLines = studentAddressLines(input.student);
  const online = isOnlineModality(input.inscription.modality);

  const locationLabel = online
    ? addressLines.length
      ? `Cours en ligne — ${addressLines.join(" ")}`
      : "Cours en ligne"
    : texte(input.inscription.course_location) || "—";

  const programmeDatesLabel = online
    ? input.inscription.dates_to_confirm
      ? datesLabel
      : startDateLabel === endDateLabel
        ? `du ${startDateLabel} au ${endDateLabel}`
        : datesLabel.startsWith("du ")
          ? datesLabel
          : `du ${startDateLabel} au ${endDateLabel}`
    : datesLabel;

  return {
    kind: "programme",
    title: online
      ? `Formation individualisée, en ligne, en ${language}`
      : "Programme de formation",
    generatedAtLabel: formatDateFr(generatedAt.toISOString()),
    inscriptionCode: texte(input.inscription.code) || "—",
    studentDisplayName: name,
    studentCivility: normalizeCivility(input.student.civility),
    studentAddressLines: addressLines,
    studentEmail: texte(input.student.email),
    studentPhone: texte(input.student.phone),
    studentCompany: texte(input.student.company),
    language: texte(input.inscription.language) || "—",
    startDateLabel,
    endDateLabel,
    datesLabel: programmeDatesLabel,
    durationHoursLabel,
    locationLabel,
    modalityLabel: modalityLabelFr(input.inscription.modality),
    groupSizeLabel: String(input.inscription.group_size ?? 1),
    priceLabel,
    depositLabel,
    balanceLabel,
    fundingLabel,
    paymentTermsLabel: buildPaymentTermsLabel({
      priceLabel,
      depositLabel,
      balanceLabel,
      payment_method: input.inscription.payment_method,
      fundingLabel,
    }),
    organization,
    organizationAddress: formatOrganizationAddress(organization),
    organizationLegalLines: organizationLegalMentions(organization),
    documentFooterLines: fliDocumentFooterLines(online ? 2 : 4),
    sections: online
      ? buildOnlineProgrammeSections({ language, durationHoursLabel })
      : PROGRAMME_SECTIONS.map((s) => ({
          title: s.title,
          paragraphs: s.paragraphs.map((p) =>
            p.replace(
              /l'exercice professionnel/g,
              `l'exercice professionnel en ${language}`
            )
          ),
        })),
    footerNote: online
      ? "Programme pédagogique en ligne — Version 2. Les modalités précises figurent aussi sur la convention."
      : "Programme personnalisé généré pour cette inscription. Les modalités précises figurent aussi sur la convention.",
  };
}

export function conventionFilename(code: string): string {
  const safe = (code || "sans-code").replace(/[^\w.-]+/g, "_");
  return `Convention-formation-${safe}.pdf`;
}

export function programmeFilename(code: string): string {
  const safe = (code || "sans-code").replace(/[^\w.-]+/g, "_");
  return `Programme-formation-${safe}.pdf`;
}

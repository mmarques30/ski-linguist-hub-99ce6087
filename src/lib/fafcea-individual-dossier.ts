/**
 * Dossier formation individualisée financée FAFCEA
 * (programme + convention adaptés métier, hors pack FIF-PL / AGEFICE).
 *
 * Cas type : accueil clientèle russophone — taxi + moniteur de ski.
 */

import {
  FLI_DOCUMENT_FOOTER_V2_LINES,
  FLI_DOCUMENT_FOOTER_V4_LINES,
  type OrganizationIdentity,
} from "./organization-identity";
import type { InscriptionDocumentPdfModel } from "./inscription-documents-pdf";

export type FafceaIndividualDossierInput = {
  student: {
    civility?: string | null;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    streetAddress: string;
    postalCode: string;
    city: string;
    company?: string | null;
  };
  language: string;
  durationHours: number;
  hourlyRateEur: number;
  /** Activités professionnelles ciblées (ordre d'affichage). */
  professionalActivities: string[];
  /** Ex. « russophone ». */
  targetClientele: string;
  /** Code provisoire du dossier (ex. FLI-FAFCEA-2026-001). */
  dossierCode: string;
  /** Dates libres tant que le FAFCEA n'a pas validé. */
  datesLabel?: string;
  identity: OrganizationIdentity;
  generatedAt?: Date;
};

export function fafceaTotalEur(input: {
  durationHours: number;
  hourlyRateEur: number;
}): number {
  return input.durationHours * input.hourlyRateEur;
}

export function formatEurFr(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\u202f\u00a0]/g, " ")
    .replace(/\s*€/g, " €");
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function activitiesLabel(activities: string[]): string {
  if (activities.length === 0) return "son activité professionnelle";
  if (activities.length === 1) return activities[0];
  if (activities.length === 2) {
    return `${activities[0]} et ${activities[1]}`;
  }
  return `${activities.slice(0, -1).join(", ")} et ${activities[activities.length - 1]}`;
}

/** Objectifs / contenu métier pour le programme FAFCEA. */
export function buildFafceaProgrammeSections(input: {
  language: string;
  durationHoursLabel: string;
  professionalActivities: string[];
  targetClientele: string;
}): Array<{ title: string; paragraphs: string[] }> {
  const language = input.language || "la langue choisie";
  const duree = input.durationHoursLabel || "—";
  const metiers = activitiesLabel(input.professionalActivities);
  const clientele = input.targetClientele.trim() || "étrangère";

  return [
    {
      title: "Objectifs",
      paragraphs: [
        "Les objectifs de cette formation sont de :",
        `• Développer les compétences en communication orale en ${language} pour l'accueil et l'accompagnement d'une clientèle ${clientele}.`,
        `• Améliorer la compréhension orale dans les situations réelles liées à ${metiers}.`,
        `• Enrichir le lexique professionnel utile à ${metiers} (accueil, consignes, sécurité, services, petite conversation).`,
        "• Consolider les bases grammaticales nécessaires à des échanges clairs et naturels.",
        "• Gagner en aisance et en confiance lors des premiers contacts et tout au long de la prestation.",
      ],
    },
    {
      title: "Public et contexte professionnel",
      paragraphs: [
        `Formation individualisée destinée à un professionnel exerçant ${metiers}, souhaitant mieux accueillir et accompagner une clientèle ${clientele}.`,
        "Le parcours part du niveau réel (test de positionnement) et se recentre sur les situations de communication prioritaires du stagiaire.",
      ],
    },
    {
      title: "Méthode et contenu",
      paragraphs: [
        "• Parcours personnalisé adapté au niveau et aux besoins spécifiques du stagiaire.",
        "• Travail en face à face pédagogique en visioconférence (Google Meet ou Zoom).",
        `• Exercices de compréhension et d'expression en ${language}.`,
        "• Mises en situation et jeux de rôle calqués sur les métiers ciblés.",
        "• Support de cours fourni.",
        "• Matériel nécessaire : ordinateur avec webcam, casque ou enceintes et microphone, connexion internet haut débit.",
      ],
    },
    {
      title: "Durée",
      paragraphs: [`${duree}, en séances individuelles en ligne (horaires définis d'un commun accord).`],
    },
    {
      title: "Déroulement d'un cours",
      paragraphs: [
        "• Vérification des acquis et corrections des exercices.",
        "• Apports linguistiques ciblés, puis pratique orale.",
        "• Jeux de rôles adaptés aux métiers et au niveau du stagiaire.",
        "• Utilisation de supports audio ou audiovisuels selon les besoins.",
        "• Consolidation des structures de base et du vocabulaire professionnel utile.",
      ],
    },
    {
      title: "Contenu prévisionnel",
      paragraphs: [
        "Ce stage permet notamment de travailler les fonctions langagières suivantes :",
        "• Bases linguistiques et grammaire utile à l'oral.",
        "• Accueil et prise de contact avec une clientèle russophone.",
        "• Taxi : compréhension de la destination, confirmation d'itinéraire, tarifs / moyens de paiement, attentes, petites conversations pendant le trajet.",
        "• Moniteur de ski : consignes de sécurité, conseils techniques simples, organisation du cours, gestion d'un imprévu, échanges de courtoisie.",
        "• Expression orale : donner des informations et instructions précises et brèves.",
        "• Expression écrite légère : messages courts (SMS / e-mail) efficaces avec les clients.",
        "• Compréhension orale : questions, demandes et instructions brèves.",
        "• Repères culturels utiles à une meilleure communication avec la clientèle russophone.",
        "Contenu prévisionnel, réajusté tout au long de la formation selon le niveau, la progression et les besoins.",
      ],
    },
    {
      title: "Évaluation",
      paragraphs: [
        "• Test de positionnement en début de parcours.",
        "• Évaluation formative continue pendant les séances.",
        "• Évaluation de fin de parcours et attestation de formation.",
      ],
    },
  ];
}

/** Articles convention en ligne adaptés FAFCEA + métiers ciblés. */
export function buildFafceaConventionSections(input: {
  language: string;
  datesLabel: string;
  durationHoursLabel: string;
  studentAddressLines: string[];
  pedagogicalContact: string;
  priceLabel: string;
  professionalActivities: string[];
  targetClientele: string;
}): Array<{ title: string; paragraphs: string[] }> {
  const language = input.language || "la langue choisie";
  const addressHint = input.studentAddressLines.join(" ").trim();
  const lieu = addressHint
    ? `formation en ligne — ${addressHint}`
    : "formation en ligne";
  const contact = input.pedagogicalContact || "Paula Rangel-Halbwachs";
  const price = input.priceLabel !== "—" ? input.priceLabel : "—";
  const metiers = activitiesLabel(input.professionalActivities);
  const clientele = input.targetClientele.trim() || "étrangère";

  return [
    {
      title: "Article I : Objet",
      paragraphs: [
        `En exécution du présent contrat, F.L.I. s'engage à organiser l'action de formation suivante : formation individualisée ${language}, en ligne, ciblée sur l'accueil et la communication avec une clientèle ${clientele} dans le cadre de ${metiers}.`,
      ],
    },
    {
      title: "Article II : Nature et caractéristique des actions de formation",
      paragraphs: [
        "L'action de formation entre dans la catégorie des actions d'acquisition et de perfectionnement des connaissances prévue à l'article L.6313-1 du code du travail.",
        `L'objectif de la formation est de permettre au stagiaire de développer et de perfectionner ses compétences en ${language} afin de communiquer efficacement avec une clientèle ${clientele}, notamment dans ses activités de ${metiers}.`,
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
        "Horaires : à définir en fonction des disponibilités du stagiaire et de celles du professeur.",
        "Effectif : 1 (cours individuel).",
      ],
    },
    {
      title: "Description des équipements",
      paragraphs: [
        "Le stagiaire devra disposer :",
        "• d'un ordinateur équipé d'une Webcam,",
        "• d'une connexion internet haut débit,",
        "• d'un casque ou enceintes et microphone,",
        "• d'un compte Google Meet ou Zoom — gratuit.",
      ],
    },
    {
      title: "Moyens pédagogiques et de suivi",
      paragraphs: [
        "• cours en face à face en ligne avec le formateur via visioconférence,",
        "• remise d'un fascicule support de cours,",
        "• exercices en ligne,",
        "• mises en situation professionnelles (taxi et enseignement du ski),",
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
    {
      title: "Suivi de l'exécution et appréciation des résultats",
      paragraphs: [
        "• Une feuille d'émargement où figureront les dates et la durée des séances sera établie et validée par la responsable de formation.",
        "• Travaux corrigés au fur et à mesure par le formateur pendant les séances.",
        "• Test de niveau en entrée et sortie de formation.",
      ],
    },
    {
      title: "Article V : Délai de rétractation",
      paragraphs: [
        "À compter de la date de signature de la présente convention, le stagiaire a un délai de 10 jours pour se rétracter, il en informe l'organisme de formation par lettre recommandée ; dans ce cas aucune somme ne pourra être exigée du stagiaire.",
      ],
    },
    {
      title: "Article VI : Dispositions financières",
      paragraphs: [
        `En contrepartie de la présente convention, le stagiaire s'engage à acquitter la somme de : ${price} nets* à l'ordre de F.L.I., correspondant au coût pédagogique de la formation.`,
        "Une demande de prise en charge sera déposée auprès du FAFCEA. Le montant effectivement pris en charge dépend de la décision du FAFCEA (formation « transverse » ou, le cas échéant, « parcours individualisé »).",
        "Le reste à charge éventuel sera réglé par le stagiaire avant le début de la formation, par virement ou carte bancaire, sur facture FLI. Aucun frais de dossier de 150 € n'est exigé pour ce parcours financé FAFCEA.",
        "(* organisme exonéré de TVA — formulaire 3511)",
      ],
    },
    {
      title: "Article VII : Interruption de la formation",
      paragraphs: [
        "En cas de l'abandon du stage par le stagiaire pour un autre motif que la force majeure reconnue, le présent contrat est résilié selon les modalités financières suivantes : règlement du montant total de ce contrat, sans remboursement des cours non suivis. En cas de cessation anticipée de la formation du fait de l'organisme de formation ou si le stagiaire est empêché de suivre la formation par suite de force majeure dûment reconnue, le contrat de formation professionnelle est résilié. Dans ce cas seules les prestations effectivement dispensées sont dues au pro rata temporis de leur valeur prévue au présent contrat.",
      ],
    },
    {
      title: "Article VIII : Cas de différend",
      paragraphs: [
        "Si une contestation ou un différend n'ont pu être réglés à l'amiable, le tribunal de Chambéry sera seul compétent pour régler le litige.",
      ],
    },
    {
      title: "Article IX : Accessibilité",
      paragraphs: [
        "Nos formations en ligne sont accessibles et adaptées aux personnes à mobilité réduite. Les formations en présentiel se déroulant dans des locaux externes à notre structure, FLI ne peut garantir de manière systématique leur conformité avec la norme PMR.",
        "FLI ne dispose pas de contenus pédagogiques adaptés pour les stagiaires en situation de handicap visuel et auditif. Cependant, nous ferons notre possible pour vous orienter vers nos partenaires offrant des formations adaptées à vos besoins à l'aide de notre base de données.",
      ],
    },
  ];
}

function baseStudentFields(input: FafceaIndividualDossierInput) {
  const name = `${input.student.firstName} ${input.student.lastName}`.trim();
  const addressLines = [
    input.student.streetAddress.trim(),
    [input.student.postalCode, input.student.city].filter(Boolean).join(" "),
  ].filter(Boolean);
  return { name, addressLines };
}

export function buildFafceaProgrammePdfModel(
  input: FafceaIndividualDossierInput
): InscriptionDocumentPdfModel {
  const generatedAt = input.generatedAt ?? new Date();
  const { name, addressLines } = baseStudentFields(input);
  const total = fafceaTotalEur(input);
  const durationHoursLabel = `${input.durationHours} heures`;
  const priceLabel = formatEurFr(total);
  const datesLabel = input.datesLabel?.trim() || "Dates à confirmer avec le stagiaire";

  return {
    kind: "programme",
    title: `Formation individualisée, en ligne, en ${input.language}`,
    generatedAtLabel: formatDateFr(generatedAt),
    inscriptionCode: input.dossierCode,
    studentDisplayName: name,
    studentCivility: (input.student.civility || "").trim(),
    studentAddressLines: addressLines,
    studentEmail: input.student.email,
    studentPhone: (input.student.phone || "").trim(),
    studentCompany: (input.student.company || "").trim(),
    language: input.language,
    startDateLabel: "—",
    endDateLabel: "—",
    datesLabel,
    durationHoursLabel,
    locationLabel: addressLines.length
      ? `Cours en ligne — ${addressLines.join(" ")}`
      : "Cours en ligne",
    modalityLabel: "En ligne — cours individuel",
    groupSizeLabel: "1",
    priceLabel,
    depositLabel: "—",
    balanceLabel: priceLabel,
    fundingLabel: "FAFCEA",
    paymentTermsLabel: `Coût pédagogique total : ${priceLabel}. Financement : FAFCEA (reste à charge éventuel selon décision du fonds).`,
    hideDepositFee: true,
    organization: input.identity,
    organizationAddress: [
      input.identity.address_line,
      [input.identity.postal_code, input.identity.city].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", "),
    organizationLegalLines: [
      input.identity.siret ? `SIRET : ${input.identity.siret}` : "",
      input.identity.activity_number
        ? `Déclaration d'activité n° ${input.identity.activity_number}`
        : "",
    ].filter(Boolean),
    documentFooterLines: [...FLI_DOCUMENT_FOOTER_V2_LINES],
    sections: buildFafceaProgrammeSections({
      language: input.language,
      durationHoursLabel,
      professionalActivities: input.professionalActivities,
      targetClientele: input.targetClientele,
    }),
    footerNote:
      "Programme pédagogique individualisé — dossier FAFCEA. Les modalités précises figurent aussi sur la convention.",
  };
}

export function buildFafceaConventionPdfModel(
  input: FafceaIndividualDossierInput
): InscriptionDocumentPdfModel {
  const generatedAt = input.generatedAt ?? new Date();
  const { name, addressLines } = baseStudentFields(input);
  const total = fafceaTotalEur(input);
  const durationHoursLabel = `${input.durationHours} heures`;
  const priceLabel = formatEurFr(total);
  const datesLabel = input.datesLabel?.trim() || "Dates à confirmer avec le stagiaire";
  const civility = (input.student.civility || "").trim();
  const org = input.identity;

  const entreSoussignes = {
    title: "Entre les soussignés",
    paragraphs: [
      `1/ L'organisme de formation : ${org.legal_name || "France Langues International"}, ${[
        org.address_line,
        [org.postal_code, org.city].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ")}${org.siret ? `, Siret : ${org.siret}` : ""}${
        org.activity_number
          ? `, enregistré sous le n° de déclaration d'activité : ${org.activity_number}`
          : ""
      }${org.activity_authority ? ` auprès du ${org.activity_authority}` : ""}${
        org.representative ? `, représenté par ${org.representative}` : ""
      }.`,
      `2/ L'entreprise ou le stagiaire : ${[civility, name].filter(Boolean).join(" ")}${
        addressLines.length ? `, ${addressLines.join(", ")}` : ""
      }${input.student.company ? ` (${input.student.company})` : ""}.`,
      "Est conclue la convention de formation professionnelle suivante.",
    ],
  };

  return {
    kind: "convention",
    title: "Convention de formation professionnelle",
    generatedAtLabel: formatDateFr(generatedAt),
    inscriptionCode: input.dossierCode,
    studentDisplayName: name,
    studentCivility: civility,
    studentAddressLines: addressLines,
    studentEmail: input.student.email,
    studentPhone: (input.student.phone || "").trim(),
    studentCompany: (input.student.company || "").trim(),
    language: input.language,
    startDateLabel: "—",
    endDateLabel: "—",
    datesLabel,
    durationHoursLabel,
    locationLabel: "En ligne",
    modalityLabel: "En ligne — cours individuel",
    groupSizeLabel: "1",
    priceLabel,
    depositLabel: "—",
    balanceLabel: priceLabel,
    fundingLabel: "FAFCEA",
    paymentTermsLabel: `Coût pédagogique total : ${priceLabel}. Financement : FAFCEA.`,
    hideDepositFee: true,
    organization: org,
    organizationAddress: [
      org.address_line,
      [org.postal_code, org.city].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(", "),
    organizationLegalLines: [
      org.siret ? `SIRET : ${org.siret}` : "",
      org.activity_number
        ? `Déclaration d'activité n° ${org.activity_number}`
        : "",
    ].filter(Boolean),
    documentFooterLines: [...FLI_DOCUMENT_FOOTER_V4_LINES],
    sections: [
      entreSoussignes,
      ...buildFafceaConventionSections({
        language: input.language,
        datesLabel,
        durationHoursLabel,
        studentAddressLines: addressLines,
        pedagogicalContact: org.representative || "Paula Rangel-Halbwachs",
        priceLabel,
        professionalActivities: input.professionalActivities,
        targetClientele: input.targetClientele,
      }),
    ],
    footerNote:
      "Document généré pour dossier FAFCEA. La convention signée fait foi.",
    onlineSignatureBlock: true,
  };
}

export function mahieuFafceaDossierInput(
  identity: OrganizationIdentity,
  generatedAt?: Date
): FafceaIndividualDossierInput {
  return {
    student: {
      civility: "M.",
      firstName: "Sébastien",
      lastName: "Mahieu",
      email: "seb.mahieu74@gmail.com",
      phone: "0784203064",
      streetAddress: "623 Rue De L'Aiguille Du Fruit",
      postalCode: "73120",
      city: "Courchevel",
    },
    language: "Russe",
    durationHours: 20,
    hourlyRateEur: 60,
    professionalActivities: ["chauffeur de taxi", "moniteur de ski"],
    targetClientele: "russophone",
    dossierCode: "FLI-FAFCEA-2026-MAHIEU",
    datesLabel: "Dates à confirmer avec le stagiaire (après décision FAFCEA)",
    identity,
    generatedAt,
  };
}

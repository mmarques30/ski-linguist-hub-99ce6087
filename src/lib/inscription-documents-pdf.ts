/**
 * Modèle des PDF Convention + Programme (dossier d'inscription FIF-PL).
 * Aligné sur supabase/functions/_shared/inscription-documents-pdf-model.ts.
 */

import {
  CONDITIONS_GENERALES_PROVENANCE,
  CONDITIONS_GENERALES_SECTIONS,
  CONDITIONS_GENERALES_TITLE,
} from "./conditions-generales-content";
import {
  formatOrganizationAddress,
  organizationLegalMentions,
  parseOrganizationIdentity,
  type OrganizationIdentity,
} from "./organization-identity";

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
  duration_hours?: number | null;
  course_location?: string | null;
  modality?: string | null;
  price?: number | null;
  deposit_amount?: number | null;
  balance_after_deposit?: number | null;
  group_size?: number | null;
  funding_organization?: string | null;
};

export type InscriptionDocumentPdfModel = {
  kind: "convention" | "programme";
  title: string;
  generatedAtLabel: string;
  inscriptionCode: string;
  studentDisplayName: string;
  studentCivility: string;
  studentAddressLines: string[];
  language: string;
  startDateLabel: string;
  endDateLabel: string;
  durationHoursLabel: string;
  locationLabel: string;
  modalityLabel: string;
  groupSizeLabel: string;
  priceLabel: string;
  depositLabel: string;
  balanceLabel: string;
  fundingLabel: string;
  organization: OrganizationIdentity;
  organizationAddress: string;
  organizationLegalLines: string[];
  sections: Array<{ title: string; paragraphs: string[] }>;
  footerNote: string;
};

function texte(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function formatEuros(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
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
  if (row.balance_after_deposit != null) return Number(row.balance_after_deposit);
  if (row.price == null) return null;
  const deposit = Number(row.deposit_amount ?? 0);
  return Number(row.price) - deposit;
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

export function buildConventionPdfModel(input: {
  inscription: InscriptionDocumentsRow;
  student: InscriptionDocumentsStudent;
  identity: unknown;
  generatedAt?: Date;
}): InscriptionDocumentPdfModel {
  const organization = parseOrganizationIdentity(input.identity);
  const generatedAt = input.generatedAt ?? new Date();
  const name = studentFullName(input.student) || "Stagiaire";

  return {
    kind: "convention",
    title: "Convention de formation professionnelle",
    generatedAtLabel: formatDateFr(generatedAt.toISOString()),
    inscriptionCode: texte(input.inscription.code) || "—",
    studentDisplayName: name,
    studentCivility: texte(input.student.civility),
    studentAddressLines: studentAddressLines(input.student),
    language: texte(input.inscription.language) || "—",
    startDateLabel: formatDateFr(input.inscription.start_date),
    endDateLabel: formatDateFr(input.inscription.end_date),
    durationHoursLabel:
      input.inscription.duration_hours != null
        ? `${input.inscription.duration_hours} heures`
        : "—",
    locationLabel: texte(input.inscription.course_location) || "—",
    modalityLabel: modalityLabelFr(input.inscription.modality),
    groupSizeLabel: String(input.inscription.group_size ?? 1),
    priceLabel: formatEuros(input.inscription.price),
    depositLabel: formatEuros(input.inscription.deposit_amount),
    balanceLabel: formatEuros(balanceAmount(input.inscription)),
    fundingLabel: texte(input.inscription.funding_organization) || "—",
    organization,
    organizationAddress: formatOrganizationAddress(organization),
    organizationLegalLines: organizationLegalMentions(organization),
    sections: [
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
    ],
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

  return {
    kind: "programme",
    title: "Programme de formation",
    generatedAtLabel: formatDateFr(generatedAt.toISOString()),
    inscriptionCode: texte(input.inscription.code) || "—",
    studentDisplayName: name,
    studentCivility: texte(input.student.civility),
    studentAddressLines: studentAddressLines(input.student),
    language: texte(input.inscription.language) || "—",
    startDateLabel: formatDateFr(input.inscription.start_date),
    endDateLabel: formatDateFr(input.inscription.end_date),
    durationHoursLabel:
      input.inscription.duration_hours != null
        ? `${input.inscription.duration_hours} heures`
        : "—",
    locationLabel: texte(input.inscription.course_location) || "—",
    modalityLabel: modalityLabelFr(input.inscription.modality),
    groupSizeLabel: String(input.inscription.group_size ?? 1),
    priceLabel: formatEuros(input.inscription.price),
    depositLabel: formatEuros(input.inscription.deposit_amount),
    balanceLabel: formatEuros(balanceAmount(input.inscription)),
    fundingLabel: texte(input.inscription.funding_organization) || "—",
    organization,
    organizationAddress: formatOrganizationAddress(organization),
    organizationLegalLines: organizationLegalMentions(organization),
    sections: PROGRAMME_SECTIONS.map((s) => ({
      title: s.title,
      paragraphs: s.paragraphs.map((p) =>
        p.replace(/l'exercice professionnel/g, `l'exercice professionnel en ${language}`)
      ),
    })),
    footerNote:
      "Programme personnalisé généré pour cette inscription. Les modalités précises figurent aussi sur la convention.",
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

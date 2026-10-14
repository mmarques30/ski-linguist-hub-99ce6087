/**
 * Mise en relation stagiaire ↔ formateur·rice (cours en ligne individuels)
 * + envoi des fiches de présence préremplies.
 *
 * Process Paula : dès règlement complet (acompte + solde / chèque),
 * envoyer les coordonnées et les fiches, puis passer l'inscription en Confirmée.
 */

export const FORMATEUR_MISE_EN_RELATION_SLUG = "formateur_mise_en_relation";

export type FormateurMiseEnRelationInput = {
  studentFirstName: string;
  studentFullName: string;
  inscriptionCode: string;
  language: string;
  /** Ex. « russe en ligne (du 12/10/2026 au 31/03/2027) » */
  formationLabel: string;
  formateurFullName: string;
  formateurEmail: string;
  formateurPhone?: string | null;
  /** « formatrice » / « formateur » / « formateur·rice » */
  contactWord?: string;
};

export function formateurContactWord(fullName: string | null | undefined): string {
  const n = (fullName || "").toLowerCase();
  // Heuristique légère — Tatiana / prénoms féminins courants côté FLI
  if (
    /\b(tatiana|paula|christelle|camila|elodie|nathalie|florence|cassandre|michelle|annick|maud|lisa|caroline|pascale)\b/.test(
      n
    )
  ) {
    return "formatrice";
  }
  if (/\b(tulio|didier|marc|alexis|pierre|rémi|remi|matthieu|dylan|michael)\b/.test(n)) {
    return "formateur";
  }
  return "formateur·rice";
}

export function buildFormateurMiseEnRelationSubject(input: {
  inscriptionCode: string;
  contactWord?: string;
}): string {
  const word = input.contactWord || "formateur·rice";
  return `Votre ${word} + fiches de présence — ${input.inscriptionCode}`;
}

/** Objet du mail mission → formateur·rice (contrat à part, hors app pour l’instant). */
export function buildFormateurMissionSubject(input: {
  inscriptionCode: string;
  language: string;
  studentFullName: string;
  contractNumber?: string | null;
}): string {
  const lang = (input.language || "formation").trim();
  const contrat = input.contractNumber?.trim()
    ? ` + contrat ${input.contractNumber.trim()}`
    : "";
  return `${input.inscriptionCode} — Mission ${lang} (${input.studentFullName})${contrat}`;
}

export function buildFormateurMiseEnRelationBodyText(
  input: FormateurMiseEnRelationInput
): string {
  const first = (input.studentFirstName || "Bonjour").trim() || "Bonjour";
  const contactWord = input.contactWord || formateurContactWord(input.formateurFullName);
  const phoneLine = input.formateurPhone?.trim()
    ? `\nTéléphone : ${input.formateurPhone.trim()}`
    : "";

  return `Bonjour ${first},

Nous avons bien reçu le règlement de votre formation ${input.formationLabel} (inscription ${input.inscriptionCode}). Merci pour votre confiance et pour avoir finalisé votre dossier.

Nous sommes ravis de pouvoir démarrer cette formation avec vous. Voici les coordonnées de votre ${contactWord}, avec qui vous pourrez organiser directement le planning de vos cours :

${input.formateurFullName}
E-mail : ${input.formateurEmail}${phoneLine}

Vous trouverez en pièces jointes les fiches de présence (FORMATEUR et STAGIAIRE), déjà préremplies. Merci de les faire signer à chaque cours, puis de nous les renvoyer à la fin des séances (en réponse à ce message ou à info@fli.fr).

Nous vous souhaitons une très belle formation. N'hésitez pas à nous écrire si vous avez la moindre question.

Bien cordialement,
Paula Rangel Halbwachs
France Langues International
info@fli.fr — 04 79 28 21 09
`;
}

export type FormateurMissionEmailInput = {
  formateurFirstName: string;
  studentFullName: string;
  studentEmail: string;
  studentPhone?: string | null;
  language: string;
  durationHours: number | null;
  /** Ex. « du 12/10/2026 au 31/03/2027 » */
  periodLabel: string;
  inscriptionCode: string;
  contractNumber?: string | null;
  hourlyRate?: number | null;
  totalAmountHt?: number | null;
};

/** Corps du mail mission séparé pour le·la formateur·rice. */
export function buildFormateurMissionBodyText(input: FormateurMissionEmailInput): string {
  const first = (input.formateurFirstName || "").trim() || "Bonjour";
  const phone = input.studentPhone?.trim() ? `\n• Téléphone : ${input.studentPhone.trim()}` : "";
  const hours =
    input.durationHours != null && Number.isFinite(Number(input.durationHours))
      ? `${Number(input.durationHours)} heures`
      : "durée selon dossier";
  const lang = (input.language || "formation").trim().toLowerCase();
  const contratLine = input.contractNumber?.trim()
    ? `\n• Contrat : ${input.contractNumber.trim()}${
        input.hourlyRate != null &&
        input.totalAmountHt != null &&
        input.durationHours != null
          ? ` (${Number(input.durationHours)} h × ${input.hourlyRate} € = ${input.totalAmountHt} € HT)`
          : ""
      }`
    : "";

  const pjLine = input.contractNumber?.trim()
    ? "Pièces jointes : contrat de prestation à me retourner signé, et fiches de présence préremplies."
    : "Pièces jointes : fiches de présence préremplies.";

  // Tutoiement systématique envers les formateurs (consigne Paula).
  return `Bonjour ${first},

J'ai le plaisir de te confier une nouvelle mission de formation individualisée en ligne. Merci encore pour ton engagement à nos côtés.

Voici les informations du stagiaire :

• Stagiaire : ${input.studentFullName}
• E-mail : ${input.studentEmail}${phone}
• Formation : ${lang} en ligne — ${hours}
• Période : ${input.periodLabel || "selon planning convenu"}
• Référence dossier : ${input.inscriptionCode}${contratLine}

Merci de contacter le stagiaire pour convenir ensemble des créneaux (Google Meet) et démarrer les cours dans les meilleures conditions.

${pjLine}

Je te souhaite une très belle collaboration et une excellente formation. Merci d'avance pour ton suivi et pour le renvoi des fiches signées en fin de séances.

Bien cordialement,
Paula Rangel Halbwachs
France Langues International
info@fli.fr — 04 79 28 21 09
`;
}

export function canSendFormateurMiseEnRelation(params: {
  studentEmail?: string | null;
  formateurEmail?: string | null;
  formateurName?: string | null;
}): boolean {
  const student = (params.studentEmail || "").trim();
  const formateur = (params.formateurEmail || "").trim();
  const name = (params.formateurName || "").trim();
  return Boolean(student && formateur && name && student.includes("@") && formateur.includes("@"));
}

/** Libellé formation pour le corps du mail (dates FR courtes). */
export function formationLabelForMiseEnRelation(input: {
  language?: string | null;
  modality?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): string {
  const lang = (input.language || "formation").trim().toLowerCase();
  const mod = (input.modality || "").toLowerCase();
  const online =
    mod.includes("ligne") ||
    mod.includes("online") ||
    mod === "en_ligne" ||
    mod === "en_ligne_individuel";
  const base = online ? `${lang} en ligne` : lang;

  const fmt = (iso: string | null | undefined) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  };
  const start = fmt(input.startDate);
  const end = fmt(input.endDate);
  if (start && end && start !== end) return `${base} (du ${start} au ${end})`;
  if (start) return `${base} (à partir du ${start})`;
  return base;
}

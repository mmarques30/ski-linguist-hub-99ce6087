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

export function buildFormateurMiseEnRelationBodyText(
  input: FormateurMiseEnRelationInput
): string {
  const first = (input.studentFirstName || "Bonjour").trim() || "Bonjour";
  const contactWord = input.contactWord || formateurContactWord(input.formateurFullName);
  const phoneLine = input.formateurPhone?.trim()
    ? `\nTéléphone : ${input.formateurPhone.trim()}`
    : "";

  return `Bonjour ${first},

Nous avons bien reçu le règlement de votre formation ${input.formationLabel} (inscription ${input.inscriptionCode}).

Voici les coordonnées de votre ${contactWord} pour organiser le planning des cours :

${input.formateurFullName}
E-mail : ${input.formateurEmail}${phoneLine}

Vous trouverez en pièces jointes les fiches de présence (FORMATEUR et STAGIAIRE), préremplies. Merci de les faire signer à chaque cours, puis de nous les renvoyer à la fin des séances (réponse à ce message ou info@fli.fr).

Nous mettons votre ${contactWord} en copie de ce message pour que vous puissiez vous contacter directement.

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

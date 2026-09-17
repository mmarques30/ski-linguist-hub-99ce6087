/**
 * Payeur d'une inscription — modèle email « Dossier de formation » (inscription_documents).
 *
 * Le dossier FIF-PL ne part que si le stagiaire est lui-même le payeur.
 * Financement « Entreprise » → l'école / l'employeur paie (modèle 8 plus tard).
 * OPCO / FIFPL et Autofinancement → le stagiaire reçoit le dossier.
 *
 * `funding_organization` est le libellé stocké sur `inscriptions`
 * (voir REGISTRATION_FUNDING_MAP).
 */

export type InscriptionPayerInput = {
  funding_organization?: string | null;
};

/** Financements où le destinataire du dossier est le stagiaire. */
const STUDENT_PAYER_MARKERS = ["opco", "fifpl", "autofinancement", "self"];

/** Financements où le payeur est l'employeur / l'école. */
const COMPANY_PAYER_MARKERS = [
  "entreprise",
  "company",
  "ecole",
  "école",
  "dsf",
  "partenaire",
];

function normalizeFunding(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

/**
 * True si le stagiaire est le payeur (dossier FIF-PL / pack stagiaire).
 * Absent ou vide → traité comme payeur stagiaire (inscriptions historiques).
 */
export function isStudentPayer(input: InscriptionPayerInput): boolean {
  const org = normalizeFunding(input.funding_organization);
  if (!org) return true;
  if (COMPANY_PAYER_MARKERS.some((m) => org.includes(m))) return false;
  if (STUDENT_PAYER_MARKERS.some((m) => org.includes(m))) return true;
  // Libellé inconnu : on n'envoie pas le dossier stagiaire par défaut.
  return false;
}

/**
 * BL-025 — échec de soumission dans `/register`.
 *
 * Recette du 11 → 15/09 : le message brut de la fonction Edge s'affichait tel
 * quel, en anglais et sans consigne (« duplicate key value violates unique
 * constraint … »). Attendu : un message en français, le vouvoiement, la saisie
 * conservée et une consigne de contact.
 *
 * Deux sources de message se mélangent derrière `submit-registration` :
 *   - des refus métier déjà rédigés en français (test obligatoire, mode de
 *     paiement manquant, e-mail déjà connu) : on les montre au stagiaire ;
 *   - des erreurs techniques (Postgres, réseau, 5xx) : on ne les montre pas,
 *     elles restent dans la console pour l'équipe.
 */

export const FLI_CONTACT_EMAIL = "info@fli.fr";
export const FLI_CONTACT_PHONE = "04 79 28 21 09";

export const REGISTRATION_FAILURE_TITLE =
  "Votre inscription n'a pas pu être enregistrée.";

export const REGISTRATION_FAILURE_INSTRUCTION =
  `Vos réponses sont conservées : vous pouvez réessayer tout de suite. ` +
  `Si le problème persiste, écrivez à ${FLI_CONTACT_EMAIL} ou appelez le ${FLI_CONTACT_PHONE}.`;

export interface RegistrationFailureNotice {
  /** Toujours en français, jamais le message brut. */
  title: string;
  /** Précision métier lisible par le stagiaire, ou `null`. */
  detail: string | null;
  /** Consigne : réessayer, e-mail, téléphone. */
  instruction: string;
}

/** Longueur au-delà de laquelle un message est forcément une trace technique. */
const LONGUEUR_MAX = 200;

const MARQUEURS_TECHNIQUES = [
  /duplicate key/i,
  /violates/i,
  /constraint/i,
  /null value in column/i,
  /permission denied/i,
  /does not exist/i,
  /invalid input syntax/i,
  /syntax error/i,
  /non-2xx/i,
  /failed to fetch/i,
  /failed to send/i,
  /networkerror/i,
  /load failed/i,
  /internal server error/i,
  /pgrst/i,
  /jwt/i,
  /\bnull\b/i,
  /\bundefined\b/i,
  /\bstack\b/i,
  /\{|\}|::|\bselect\b|\binsert\b|\bupdate\b/i,
];

// Mots anglais courants dans les messages d'infrastructure. Aucun n'existe en
// français (« erreur », « existe », « serveur »… s'écrivent autrement).
const MARQUEURS_ANGLAIS =
  /\b(the|and|not|does|already|exists|value|column|table|row|request|failed|error|invalid|unauthorized|forbidden|server|timeout|unable|missing|required)\b/i;

function messageBrut(error: unknown): string {
  if (typeof error === "string") return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (error && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    for (const champ of ["error", "message", "details", "hint"]) {
      const valeur = rec[champ];
      if (typeof valeur === "string" && valeur.trim()) return valeur.trim();
    }
  }
  return "";
}

/** Un message est montrable s'il est déjà rédigé pour le stagiaire, en français. */
export function isStudentFacingMessage(raw: string): boolean {
  const message = raw.trim();
  if (!message || message.length > LONGUEUR_MAX) return false;
  if (/^erreur interne$/i.test(message)) return false;
  if (MARQUEURS_TECHNIQUES.some((motif) => motif.test(message))) return false;
  if (MARQUEURS_ANGLAIS.test(message)) return false;
  return true;
}

function detailAffichable(error: unknown): string | null {
  const brut = messageBrut(error);
  if (!isStudentFacingMessage(brut)) return null;
  return /[.!?]$/.test(brut) ? brut : `${brut}.`;
}

export function registrationFailureNotice(
  error: unknown
): RegistrationFailureNotice {
  return {
    title: REGISTRATION_FAILURE_TITLE,
    detail: detailAffichable(error),
    instruction: REGISTRATION_FAILURE_INSTRUCTION,
  };
}

export const REGISTRATION_CHECKOUT_FAILURE_TITLE =
  "Le paiement en ligne n'a pas pu démarrer.";

export const REGISTRATION_CHECKOUT_FAILURE_INSTRUCTION =
  `Votre inscription est bien enregistrée : ne la recommencez pas. ` +
  `Indiquez-nous votre code d'inscription à ${FLI_CONTACT_EMAIL} ou au ` +
  `${FLI_CONTACT_PHONE} et nous vous enverrons un nouveau lien de paiement.`;

/** L'inscription est créée, seul le règlement en ligne a échoué. */
export function registrationCheckoutFailureNotice(
  error: unknown
): RegistrationFailureNotice {
  return {
    title: REGISTRATION_CHECKOUT_FAILURE_TITLE,
    detail: detailAffichable(error),
    instruction: REGISTRATION_CHECKOUT_FAILURE_INSTRUCTION,
  };
}

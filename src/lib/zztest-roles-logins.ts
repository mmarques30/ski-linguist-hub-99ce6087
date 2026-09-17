/**
 * Comptes ZZTEST pour tester les vues formateur et stagiaire.
 * Emails @example.invalid : aucun courrier réel ; nettoyables via le kit ZZTEST.
 *
 * Connexion : carte « Administration FLI » sur /auth (mot de passe), même pour
 * le stagiaire — la carte « Espace stagiaire » n'offre que le magic link.
 */

export const ZZTEST_FORMATEUR_LOGIN = {
  roleLabel: "Formateur",
  email: "zztest.formateur@example.invalid",
  password: "ZZTEST-Formateur1!",
  homePath: "/formateur/evaluations",
  howTo: "Sur /auth, carte Administration FLI → email + mot de passe. Redirection vers /formateur/evaluations.",
} as const;

export const ZZTEST_STAGIAIRE_LOGIN = {
  roleLabel: "Stagiaire",
  email: "zztest.stagiaire@example.invalid",
  password: "ZZTEST-Stagiaire1!",
  homePath: "/student/dashboard",
  howTo: "Sur /auth (pas mode student), carte Administration FLI → email + mot de passe. Redirection vers /student/dashboard.",
} as const;

export const ZZTEST_ROLE_LOGINS = [ZZTEST_FORMATEUR_LOGIN, ZZTEST_STAGIAIRE_LOGIN] as const;

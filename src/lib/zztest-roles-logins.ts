/**
 * Comptes ZZTEST pour tester les vues formateur et stagiaire.
 * Emails @example.invalid : aucun courrier réel ; nettoyables via le kit ZZTEST.
 *
 * Connexion : carte « Administration FLI » sur /auth (mot de passe), même pour
 * le stagiaire — la carte « Espace stagiaire » n'offre que le magic link.
 *
 * Sécurité (scan 14/10/2026) : aucun mot de passe en clair dans le dépôt.
 * Provisionner via `scripts/sql/zztest_roles_logins.sql` avec des secrets
 * locaux (`set_config`), puis les stocker hors Git (1Password / vault équipe).
 * En production : désactiver ou rotationner les mots de passe de ces comptes.
 */

export const ZZTEST_ADMIN_LOGIN = {
  roleLabel: "Admin",
  email: "zztest.admin@example.invalid",
  homePath: "/",
  howTo:
    "Sur /auth, carte Administration FLI → email + mot de passe (secret hors dépôt). Accès staff / pack fin de formation.",
} as const;

export const ZZTEST_FORMATEUR_LOGIN = {
  roleLabel: "Formateur",
  email: "zztest.formateur@example.invalid",
  homePath: "/formateur/tableau-de-bord",
  howTo:
    "Sur /auth, carte Administration FLI → email + mot de passe (secret hors dépôt). Redirection vers /formateur/tableau-de-bord.",
} as const;

export const ZZTEST_STAGIAIRE_LOGIN = {
  roleLabel: "Stagiaire",
  email: "zztest.stagiaire@example.invalid",
  homePath: "/student/dashboard",
  howTo:
    "Sur /auth (pas mode student), carte Administration FLI → email + mot de passe (secret hors dépôt). Redirection vers /student/dashboard.",
} as const;

export const ZZTEST_ROLE_LOGINS = [
  ZZTEST_ADMIN_LOGIN,
  ZZTEST_FORMATEUR_LOGIN,
  ZZTEST_STAGIAIRE_LOGIN,
] as const;

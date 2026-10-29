/**
 * Libellés auth FR — évite les messages Supabase bruts (souvent en anglais).
 */

export function authEmailLabel(): string {
  return "Adresse e-mail";
}

/** Titre toast quand la saisie Zod échoue. */
export function authValidationToastTitle(): string {
  return "Saisie invalide";
}

/** Message utilisateur pour une erreur Auth Supabase. */
export function describeAuthError(message: string | undefined | null): string {
  const raw = (message ?? "").trim();
  if (!raw) return "Une erreur est survenue. Réessayez dans un instant.";

  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Adresse e-mail ou mot de passe incorrect";
  }
  if (lower.includes("email not confirmed")) {
    return "Cette adresse n'a pas encore été confirmée";
  }
  if (lower.includes("user not found") || lower.includes("user_not_found")) {
    return "Aucun compte ne correspond à cette adresse";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Trop de tentatives. Réessayez dans quelques minutes";
  }
  if (
    lower.includes("same password") ||
    lower.includes("should be different") ||
    lower.includes("different from the old")
  ) {
    return "Choisis un mot de passe différent de l'actuel";
  }
  if (lower.includes("weak") || lower.includes("pwned") || lower.includes("leaked")) {
    return "Ce mot de passe est trop faible ou compromis. Choisis-en un autre";
  }
  if (lower.includes("session") && (lower.includes("expir") || lower.includes("missing"))) {
    return "Session expirée. Reconnecte-toi puis réessaie.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Connexion impossible. Vérifiez votre réseau et réessayez";
  }
  if (lower.includes("same_password") || lower.includes("should be different")) {
    return "Ton nouveau mot de passe doit être différent de l’ancien.";
  }
  if (lower.includes("weak") || lower.includes("pwned") || lower.includes("easy to guess")) {
    return "Ce mot de passe est trop faible. Choisis-en un plus long ou moins courant.";
  }
  if (
    lower.includes("session expirée") ||
    lower.includes("session missing") ||
    lower.includes("session_not_found") ||
    lower.includes("jwt expired") ||
    lower.includes("refresh token")
  ) {
    return "Session expirée. Reconnecte-toi puis réessaie.";
  }
  // Masquer uniquement un message clairement technique / anglais.
  const looksTechnicalEnglish =
    /\b(jwt|token|oauth|supabase|postgres|sql|stack|exception|undefined|null)\b/i.test(
      raw,
    ) ||
    /\b(error|failed|invalid|denied|forbidden|unauthorized|expired)\b/i.test(raw);
  if (looksTechnicalEnglish && !/[àâäéèêëïîôùûüç]/i.test(raw)) {
    return "Connexion impossible. Réessayez ou contactez FLI.";
  }
  return raw;
}

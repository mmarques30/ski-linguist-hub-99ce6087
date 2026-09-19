export type PartnerReviewReason = "email_as_name" | "attention_prefix";

const ATTENTION_PREFIX_RE = /^[àa]\s*l[''']attention/i;

/** Nom qui ressemble à une adresse e-mail (signal doux, pas bloquant). */
export function looksLikeEmailName(name: string): boolean {
  const trimmed = (name ?? "").trim();
  if (!trimmed.includes("@")) return false;
  const at = trimmed.indexOf("@");
  return at > 0 && at < trimmed.length - 1;
}

/** Nom commençant par « à l'attention » (variantes d'apostrophe). */
export function startsWithAttention(name: string): boolean {
  return ATTENTION_PREFIX_RE.test((name ?? "").trim());
}

export function partnerReviewReasons(name: string): PartnerReviewReason[] {
  const reasons: PartnerReviewReason[] = [];
  if (looksLikeEmailName(name)) reasons.push("email_as_name");
  if (startsWithAttention(name)) reasons.push("attention_prefix");
  return reasons;
}

export function partnerNeedsReview(name: string): boolean {
  return partnerReviewReasons(name).length > 0;
}

const REASON_LABELS: Record<PartnerReviewReason, string> = {
  email_as_name: "Nom = e-mail",
  attention_prefix: "À l'attention",
};

/** Libellés courts en français pour l'UI. */
export function partnerReviewLabel(reasons: PartnerReviewReason[]): string {
  return reasons.map((r) => REASON_LABELS[r]).join(" · ");
}

/**
 * Filtre PostgREST `.or()` pour les partenaires à vérifier.
 * Les valeurs avec apostrophe sont entourées de guillemets doubles.
 */
export function buildPartnerNeedsReviewFilter(): string {
  return [
    "name.ilike.%@%",
    'name.ilike."%À l\'attention%"',
    'name.ilike."%A l\'attention%"',
  ].join(",");
}

/**
 * BL-036 — identité de l'organisme de formation.
 *
 * Source de vérité : `app_settings.fli_identity`, déjà lue par les PDF
 * d'évaluation (C.5). `/settings` l'écrit désormais vraiment : avant, la carte
 * « Organisation » affichait des valeurs en dur et fausses, et le bouton
 * « Enregistrer les modifications » ne faisait qu'un `console.log`.
 *
 * Les cinq mentions ajoutées (SIRET, numéro de déclaration d'activité, autorité
 * d'enregistrement, représentant légal, site web) sont celles que porte une
 * convention de formation professionnelle. Elles sont facultatives côté type :
 * Paula les remplit elle-même, et les documents omettent une mention vide
 * plutôt que d'afficher un trou.
 */

export const ORGANIZATION_IDENTITY_KEY = "fli_identity";

export interface OrganizationIdentity {
  legal_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  phone: string;
  email: string;
  siret: string;
  activity_number: string;
  activity_authority: string;
  representative: string;
  website: string;
  logo_url: string;
}

export type OrganizationIdentityField = keyof OrganizationIdentity;

export interface OrganizationIdentityFieldSpec {
  key: OrganizationIdentityField;
  label: string;
  /** Sans ces mentions, aucun document nominatif n'est valable. */
  required: boolean;
  help?: string;
  inputType?: "text" | "email" | "tel" | "url";
}

export const ORGANIZATION_IDENTITY_FIELDS: OrganizationIdentityFieldSpec[] = [
  { key: "legal_name", label: "Raison sociale", required: true },
  { key: "representative", label: "Représenté par", required: false, help: "Nom figurant sur les conventions" },
  { key: "address_line", label: "Adresse", required: true },
  { key: "postal_code", label: "Code postal", required: true },
  { key: "city", label: "Ville", required: true },
  { key: "phone", label: "Téléphone", required: false, inputType: "tel" },
  { key: "email", label: "Email de contact", required: false, inputType: "email" },
  { key: "website", label: "Site web", required: false, inputType: "url" },
  { key: "siret", label: "SIRET", required: false },
  {
    key: "activity_number",
    label: "Numéro de déclaration d'activité",
    required: false,
    help: "Mention obligatoire sur les conventions de formation",
  },
  {
    key: "activity_authority",
    label: "Enregistré auprès de",
    required: false,
    help: "Ex. : préfet de région Auvergne-Rhône-Alpes",
  },
];

export const EMPTY_ORGANIZATION_IDENTITY: OrganizationIdentity = {
  legal_name: "",
  address_line: "",
  postal_code: "",
  city: "",
  phone: "",
  email: "",
  siret: "",
  activity_number: "",
  activity_authority: "",
  representative: "",
  website: "",
  logo_url: "",
};

const FLI_INVOICE_DEFAULTS = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  postalCode: "73800",
  city: "Montmélian",
  phone: "+33 (0)6 27 13 45 16",
  email: "contact@france-langues-international.com",
  siret: "484 772 041 00048",
} as const;

const FLI_EMAIL_FOOTER_DEFAULTS = {
  displayName: "FLI — France Langues International",
  address: "25 avenue de la Gare",
  postalCode: "73800",
  city: "Montmélian",
  phone: "04 79 28 21 09",
  email: "info@fli.fr",
} as const;

export interface OrganizationInvoiceHeader {
  name: string;
  address: string;
  cityLine: string;
  phone: string;
  email: string;
  siret: string;
  logoUrl: string;
}

function texte(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Tolérant : une clé absente devient une chaîne vide, jamais `undefined`. */
export function parseOrganizationIdentity(value: unknown): OrganizationIdentity {
  const rec = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const identity = { ...EMPTY_ORGANIZATION_IDENTITY };
  for (const field of ORGANIZATION_IDENTITY_FIELDS) {
    identity[field.key] = texte(rec[field.key]);
  }
  identity.logo_url = texte(rec.logo_url);
  return identity;
}

/** Forme stockée dans `app_settings.value` (jsonb), valeurs déjà rognées. */
export function organizationIdentityToJson(
  identity: OrganizationIdentity
): Record<string, string> {
  const json: Record<string, string> = {};
  for (const field of ORGANIZATION_IDENTITY_FIELDS) {
    json[field.key] = identity[field.key].trim();
  }
  json.logo_url = identity.logo_url.trim();
  return json;
}

export function missingRequiredIdentityFields(
  identity: OrganizationIdentity
): OrganizationIdentityFieldSpec[] {
  return ORGANIZATION_IDENTITY_FIELDS.filter(
    (field) => field.required && !identity[field.key]
  );
}

export function isOrganizationIdentityComplete(identity: OrganizationIdentity): boolean {
  return missingRequiredIdentityFields(identity).length === 0;
}

/** « 73800 Montmélian » — les parties vides disparaissent. */
export function formatOrganizationCityLine(identity: OrganizationIdentity): string {
  return [identity.postal_code, identity.city].filter(Boolean).join(" ");
}

/** « 25 avenue de la Gare, 73800 Montmélian » — les parties vides disparaissent. */
export function formatOrganizationAddress(identity: OrganizationIdentity): string {
  const ville = formatOrganizationCityLine(identity);
  return [identity.address_line, ville].filter(Boolean).join(", ");
}

/** Pied d'email HTML aligné sur FLI_FOOTER_HTML, alimenté par l'identité saisie. */
export function buildOrganizationEmailFooterHtml(identity: OrganizationIdentity): string {
  const name = identity.legal_name.trim() || FLI_EMAIL_FOOTER_DEFAULTS.displayName;
  const address = identity.address_line.trim() || FLI_EMAIL_FOOTER_DEFAULTS.address;
  const cityLine =
    formatOrganizationCityLine(identity) ||
    `${FLI_EMAIL_FOOTER_DEFAULTS.postalCode} ${FLI_EMAIL_FOOTER_DEFAULTS.city}`;
  const phone = identity.phone.trim() || FLI_EMAIL_FOOTER_DEFAULTS.phone;
  const email = identity.email.trim() || FLI_EMAIL_FOOTER_DEFAULTS.email;

  return `<p style="margin-top:24px">Cordialement,</p>
<p>
  <strong>${escapeHtml(name)}</strong><br/>
  ${escapeHtml(address)}<br/>
  ${escapeHtml(cityLine)}<br/>
  Tél. : ${escapeHtml(phone)}<br/>
  <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
</p>`;
}

/** En-tête facture : repli sur les coordonnées FLI historiques si un champ est vide. */
export function organizationInvoiceHeader(
  identity: OrganizationIdentity
): OrganizationInvoiceHeader {
  return {
    name: identity.legal_name.trim() || FLI_INVOICE_DEFAULTS.name,
    address: identity.address_line.trim() || FLI_INVOICE_DEFAULTS.address,
    cityLine:
      formatOrganizationCityLine(identity) ||
      `${FLI_INVOICE_DEFAULTS.postalCode} ${FLI_INVOICE_DEFAULTS.city}`,
    phone: identity.phone.trim() || FLI_INVOICE_DEFAULTS.phone,
    email: identity.email.trim() || FLI_INVOICE_DEFAULTS.email,
    siret: identity.siret.trim() || FLI_INVOICE_DEFAULTS.siret,
    logoUrl: identity.logo_url.trim(),
  };
}

/** Mentions légales d'un pied de document : rien si elles ne sont pas saisies. */
export function organizationLegalMentions(identity: OrganizationIdentity): string[] {
  return [
    identity.siret ? `SIRET : ${identity.siret}` : "",
    identity.activity_number
      ? `Déclaration d'activité n° ${identity.activity_number}`
      : "",
    identity.activity_authority
      ? `Enregistré auprès du ${identity.activity_authority}`
      : "",
  ].filter(Boolean);
}

/**
 * Pied de page Version 4 des conventions / programmes FLI (en ligne),
 * fourni par Paula le 24 septembre 2026.
 */
export const FLI_DOCUMENT_FOOTER_V4_LINES = [
  "Formation Professionnelle Continue : Langues Étrangères",
  "SARL au capital de 5000 euros. 25 avenue de la gare, 73800 Montmélian",
  "Siret : 484 772 041 00048- RCS Chambéry – NAF : 8559A Organisme de formation n° 82 73 01 366 73",
  "Version 4 du 24 septembre 2026",
] as const;

export function fliDocumentFooterLines(): string[] {
  return [...FLI_DOCUMENT_FOOTER_V4_LINES];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

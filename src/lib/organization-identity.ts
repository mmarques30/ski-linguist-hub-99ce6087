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
};

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

/** « 25 avenue de la Gare, 73800 Montmélian » — les parties vides disparaissent. */
export function formatOrganizationAddress(identity: OrganizationIdentity): string {
  const ville = [identity.postal_code, identity.city].filter(Boolean).join(" ");
  return [identity.address_line, ville].filter(Boolean).join(", ");
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

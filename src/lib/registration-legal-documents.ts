/**
 * BL-023 — documents juridiques de l'étape 7 de `/register`.
 *
 * Recette du 11 → 15/09 : « J'accepte les conditions générales » ne donnait
 * accès à aucun texte. Les deux liens existaient bien dans le dépôt, mais ils
 * pointaient vers `/registration-documents/conditions-generales.pdf` et
 * `/registration-documents/reglement-interieur.pdf`, deux fichiers **absents**
 * de `public/registration-documents/` : ils répondaient 404.
 *
 * Attendu par Paula : un lien vers les conditions générales de formation, ouvert
 * dans un nouvel onglet, placé **avant** la case à cocher.
 *
 * On ne remplace donc pas un lien mort par un autre : les conditions générales
 * sont une page de l'application (`/conditions-generales`), alimentée par
 * l'identité saisie dans `/settings` et par les articles de la convention de
 * formation FLI. Le règlement intérieur, dont FLI n'a pas encore de version
 * publiable, est annoncé comme communiqué sur demande — jamais par un lien qui
 * n'ouvre rien.
 */

import { FLI_CONTACT_EMAIL, FLI_CONTACT_PHONE } from "./registration-error-message";

export const CONDITIONS_GENERALES_PATH = "/conditions-generales";

export type LegalDocumentAvailability =
  /** Page de l'application, ouverte dans un nouvel onglet. */
  | "page"
  /** Fichier publié sous `public/`. */
  | "file"
  /** Pas encore publié : communiqué par l'équipe sur demande. */
  | "on_request";

export interface RegistrationLegalDocument {
  key: "conditionsGenerales" | "reglementInterieur";
  label: string;
  availability: LegalDocumentAvailability;
  /** Renseigné seulement pour `page` et `file`. */
  href?: string;
}

export const REGISTRATION_LEGAL_DOCUMENTS: Record<
  RegistrationLegalDocument["key"],
  RegistrationLegalDocument
> = {
  conditionsGenerales: {
    key: "conditionsGenerales",
    label: "conditions générales de formation",
    availability: "page",
    href: CONDITIONS_GENERALES_PATH,
  },
  reglementInterieur: {
    key: "reglementInterieur",
    label: "règlement intérieur",
    availability: "on_request",
  },
};

export const REGISTRATION_LEGAL_DOCUMENT_LIST: RegistrationLegalDocument[] = [
  REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales,
  REGISTRATION_LEGAL_DOCUMENTS.reglementInterieur,
];

export function isLegalDocumentReadable(
  document: RegistrationLegalDocument
): boolean {
  return document.availability !== "on_request" && Boolean(document.href);
}

/** Libellé en tête de liste : « Conditions générales de formation ». */
export function legalDocumentTitle(document: RegistrationLegalDocument): string {
  return document.label.charAt(0).toUpperCase() + document.label.slice(1);
}

export const LEGAL_DOCUMENT_ON_REQUEST_NOTICE =
  `remis avec vos documents d'inscription, et disponible sur demande à ` +
  `${FLI_CONTACT_EMAIL} ou au ${FLI_CONTACT_PHONE}`;

/** Aucune case à cocher sans au moins les conditions générales lisibles. */
export function canAcceptLegalTerms(): boolean {
  return isLegalDocumentReadable(REGISTRATION_LEGAL_DOCUMENTS.conditionsGenerales);
}

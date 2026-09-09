/** Spec certificat FLI — bilan Entrée / Sortie (jamais la piste comme niveau final). */

export const CECRL_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CecrlLevel = (typeof CECRL_LEVELS)[number];

export const OBJECTIF_ATTEINT_VALUES = ["oui", "partiellement", "non"] as const;
export type ObjectifAtteint = (typeof OBJECTIF_ATTEINT_VALUES)[number];

export const OBJECTIF_ATTEINT_LABELS: Record<ObjectifAtteint, string> = {
  oui: "Oui",
  partiellement: "Partiellement",
  non: "Non",
};

/** Texte exact obligatoire sous le bilan (spec FLI). */
export const CERTIFICATE_SNMSF_DISCLAIMER =
  "Le niveau indiqué ci-dessus a été observé pendant les cours et évalué de façon continue par votre formateur·rice. Il ne remplace pas l'évaluation officielle en langue vivante validée par le SNMSF, qui mesure de façon structurée, lors d'une épreuve unique, l'ensemble des compétences linguistiques.";

export interface ProgressionEntryFields {
  niveau_general_entree: string | null;
  niveau_technique_entree: string | null;
  remarques_entree: string | null;
}

export interface ProgressionExitFields {
  niveau_general_sortie: string | null;
  niveau_technique_sortie: string | null;
  objectif_atteint: string | null;
  commentaire_sortie: string | null;
}

export type ProgressionFields = ProgressionEntryFields & ProgressionExitFields;

export function isBlank(value: string | null | undefined): boolean {
  return !value || !String(value).trim();
}

export function isEntryFormComplete(fields: ProgressionEntryFields): boolean {
  return (
    !isBlank(fields.niveau_general_entree) &&
    !isBlank(fields.niveau_technique_entree)
  );
}

export function isExitFormComplete(fields: ProgressionExitFields): boolean {
  return (
    !isBlank(fields.niveau_general_sortie) &&
    !isBlank(fields.niveau_technique_sortie) &&
    OBJECTIF_ATTEINT_VALUES.includes(fields.objectif_atteint as ObjectifAtteint) &&
    !isBlank(fields.commentaire_sortie)
  );
}

export function canIssueCertificate(fields: ProgressionExitFields): boolean {
  return isExitFormComplete(fields);
}

export type MissingDocumentCode =
  | "FORMULAIRE_ENTREE"
  | "FORMULAIRE_SORTIE"
  | "CERTIFICAT";

export interface MissingDocumentItem {
  code: MissingDocumentCode;
  label: string;
  reason: string;
}

export function listMissingFormationDocuments(input: {
  entryFormComplete: boolean;
  exitFormComplete: boolean;
  hasCertificate: boolean;
  /** When true, exit form + certificate are expected (course ended or end-pack). */
  expectExitDocuments: boolean;
}): MissingDocumentItem[] {
  const missing: MissingDocumentItem[] = [];

  if (!input.entryFormComplete) {
    missing.push({
      code: "FORMULAIRE_ENTREE",
      label: "Formulaire d'entrée formateur",
      reason: "Niveaux général et technique d'entrée non renseignés",
    });
  }

  if (input.expectExitDocuments && !input.exitFormComplete) {
    missing.push({
      code: "FORMULAIRE_SORTIE",
      label: "Formulaire de sortie formateur",
      reason:
        "Bilan de sortie incomplet (niveaux CECRL, objectif atteint, commentaire)",
    });
  }

  if (input.expectExitDocuments && input.exitFormComplete && !input.hasCertificate) {
    missing.push({
      code: "CERTIFICAT",
      label: "Certificat de fin de formation",
      reason: "Formulaire de sortie rempli mais certificat non généré",
    });
  }

  return missing;
}

/** Sync deprecated entry_level / exit_level from the four progression columns. */
export function legacyLevelSyncFromProgression(fields: ProgressionFields): {
  entry_level: string | null;
  exit_level: string | null;
  final_general_level: string | null;
  final_specific_level: string | null;
  progression: string | null;
} {
  const objectif = fields.objectif_atteint
    ? OBJECTIF_ATTEINT_LABELS[fields.objectif_atteint as ObjectifAtteint] ||
      fields.objectif_atteint
    : null;

  return {
    entry_level: fields.niveau_general_entree,
    exit_level: fields.niveau_general_sortie,
    final_general_level: fields.niveau_general_sortie,
    final_specific_level: fields.niveau_technique_sortie,
    progression: objectif,
  };
}

export interface CertificateBilanData {
  studentName: string;
  language: string;
  startDate: string;
  endDate: string;
  durationHoursPlanned: number | null;
  hoursFollowed: number | null;
  locationOrModality: string | null;
  formateurName: string | null;
  niveauGeneralEntree: string;
  niveauTechniqueEntree: string;
  niveauGeneralSortie: string;
  niveauTechniqueSortie: string;
  objectifAtteint: ObjectifAtteint;
  commentaire: string;
  issueDate: string;
  inscriptionCode?: string | null;
}

export function buildProgressionSnapshot(data: CertificateBilanData) {
  return {
    version: 1,
    disclaimer: CERTIFICATE_SNMSF_DISCLAIMER,
    studentName: data.studentName,
    language: data.language,
    startDate: data.startDate,
    endDate: data.endDate,
    durationHoursPlanned: data.durationHoursPlanned,
    hoursFollowed: data.hoursFollowed,
    locationOrModality: data.locationOrModality,
    formateurName: data.formateurName,
    bilan: {
      niveau_general: {
        entree: data.niveauGeneralEntree,
        sortie: data.niveauGeneralSortie,
      },
      niveau_technique: {
        entree: data.niveauTechniqueEntree,
        sortie: data.niveauTechniqueSortie,
      },
      objectif_atteint: data.objectifAtteint,
      commentaire: data.commentaire,
    },
    issueDate: data.issueDate,
    inscriptionCode: data.inscriptionCode ?? null,
  };
}

export function formatLocationOrModality(input: {
  course_location?: string | null;
  modality?: string | null;
}): string | null {
  const loc = input.course_location?.trim();
  const mod = input.modality?.trim();
  if (loc && mod) return `${loc} · ${mod}`;
  return loc || mod || null;
}

export function suggestGeneralEntryFromPlacement(input: {
  pisteLabel?: string | null;
  entryLevelCecrl?: string | null;
}): string {
  if (input.pisteLabel && input.pisteLabel.trim()) return input.pisteLabel.trim();
  return "";
}

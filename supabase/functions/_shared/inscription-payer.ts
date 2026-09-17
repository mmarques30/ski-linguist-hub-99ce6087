/**
 * Miroir Edge de src/lib/inscription-payer.ts — garder les deux alignés.
 */

export type InscriptionPayerInput = {
  funding_organization?: string | null;
};

const STUDENT_PAYER_MARKERS = ["opco", "fifpl", "autofinancement", "self"];

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

export function isStudentPayer(input: InscriptionPayerInput): boolean {
  const org = normalizeFunding(input.funding_organization);
  if (!org) return true;
  if (COMPANY_PAYER_MARKERS.some((m) => org.includes(m))) return false;
  if (STUDENT_PAYER_MARKERS.some((m) => org.includes(m))) return true;
  return false;
}

/** Discipline et cycle de formation — test_candidates, si moniteur. */

export const SKI_DISCIPLINES = ["alpin", "nordique"] as const;
export type SkiDiscipline = (typeof SKI_DISCIPLINES)[number];

export const SKI_DISCIPLINE_LABELS: Record<SkiDiscipline, string> = {
  alpin: "Alpin",
  nordique: "Nordique",
};

export function isSkiDiscipline(value: string | null | undefined): value is SkiDiscipline {
  return value === "alpin" || value === "nordique";
}

export function moniteurRequiresSkiFields(profession: string | null | undefined): boolean {
  return profession === "moniteur";
}

export function formatSkiDisciplineLabel(value: string | null | undefined): string {
  if (isSkiDiscipline(value)) return SKI_DISCIPLINE_LABELS[value];
  return value?.trim() || "—";
}

export function skiFieldsMissing(
  profession: string | null | undefined,
  skiDiscipline: string | null | undefined,
  trainingCycle: string | null | undefined
): boolean {
  if (!moniteurRequiresSkiFields(profession)) return false;
  return !isSkiDiscipline(skiDiscipline) || !trainingCycle?.trim();
}

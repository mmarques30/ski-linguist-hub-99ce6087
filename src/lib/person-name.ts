/** Tri / libellés de personnes (formateurs, etc.) — ordre FR par nom puis prénom. */

export type PersonNameFields = {
  first_name?: string | null;
  last_name?: string | null;
};

const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

export function compareByLastName(a: PersonNameFields, b: PersonNameFields): number {
  const byLast = collator.compare(a.last_name?.trim() || "", b.last_name?.trim() || "");
  if (byLast !== 0) return byLast;
  return collator.compare(a.first_name?.trim() || "", b.first_name?.trim() || "");
}

/** Libellé listes déroulantes admin : « Nom Prénom » (cohérent avec le tri). */
export function formatNameLastFirst(person: PersonNameFields): string {
  return [person.last_name, person.first_name].map((p) => p?.trim()).filter(Boolean).join(" ");
}

export function sortByLastName<T extends PersonNameFields>(rows: T[]): T[] {
  return [...rows].sort(compareByLastName);
}

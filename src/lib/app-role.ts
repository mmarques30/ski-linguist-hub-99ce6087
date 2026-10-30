/** Rôles applicatifs stockés dans `user_roles.role` (enum `app_role`). */
export type AppRole = "admin" | "formateur" | "student" | "user";

/**
 * Priorité quand un compte a plusieurs lignes dans `user_roles`
 * (ex. admin + formateur pour Paula) : le back-office admin l'emporte,
 * la vue formateur se consulte via Assister (`/portails/formateur/:id`).
 *
 * Ordre : admin > formateur > student > user.
 */
const ROLE_PRIORITY: readonly AppRole[] = ["admin", "formateur", "student", "user"];

export function resolveAppRole(
  roles: readonly (string | null | undefined)[] | null | undefined
): AppRole | null {
  if (!roles?.length) return null;
  const set = new Set(
    roles.filter((r): r is string => typeof r === "string" && r.length > 0)
  );
  for (const role of ROLE_PRIORITY) {
    if (set.has(role)) return role;
  }
  const first = [...set][0];
  return (first as AppRole) ?? null;
}

/** Charge les rôles d'un utilisateur et renvoie le rôle effectif (jamais maybeSingle). */
export async function fetchEffectiveAppRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: { from: (table: string) => any },
  userId: string
): Promise<AppRole | null> {
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  const rows = (data ?? []) as { role: string }[];
  return resolveAppRole(rows.map((r) => r.role));
}

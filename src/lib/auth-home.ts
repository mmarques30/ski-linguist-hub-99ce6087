import { ADMIN_HOME_PATH } from "@/lib/admin-home";

/** Accueil après connexion selon le rôle (formateur ≠ admin). */
export function homePathForRole(role: string | null | undefined): string {
  if (role === "student") return "/student/dashboard";
  if (role === "formateur") return "/formateur/tableau-de-bord";
  return ADMIN_HOME_PATH;
}

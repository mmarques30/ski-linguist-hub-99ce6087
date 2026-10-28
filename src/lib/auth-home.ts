import { ADMIN_HOME_PATH } from "@/lib/admin-home";

/** Page d'accueil après connexion selon le rôle (formateur, stagiaire, sinon back-office). */
export function homePathForRole(role: string | null | undefined): string {
  if (role === "formateur") return "/formateur/tableau-de-bord";
  if (role === "student") return "/student/dashboard";
  return ADMIN_HOME_PATH;
}

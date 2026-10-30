import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchEffectiveAppRole } from "@/lib/app-role";
import { routeKeyParent } from "@/lib/route-permissions";

export function useUserPermissions() {
  const { user } = useAuth();

  // Même clé que ProtectedRoute / Auth pour partager le cache (évite course SPA Assister).
  // Plusieurs rôles possibles (admin + formateur) → fetchEffectiveAppRole, pas .maybeSingle().
  const { data: role, isPending: rolePending } = useQuery({
    queryKey: ["user-role-check", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchEffectiveAppRole(supabase, user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = role === "admin";
  // Si admin + formateur, le rôle effectif est admin → back-office + Assister.
  const isFormateur = role === "formateur";

  const { data: permissions = [], isPending: permsPending } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_permissions")
        .select("route_key, can_view, can_edit")
        .eq("user_id", user.id);
      return data ?? [];
    },
    enabled: !!user && !isAdmin && !isFormateur,
    staleTime: 5 * 60 * 1000,
  });

  const hasFlag = (routeKey: string, flag: "can_view" | "can_edit"): boolean => {
    if (permissions.some((p) => p.route_key === routeKey && p[flag])) return true;
    const parent = routeKeyParent(routeKey);
    if (parent && permissions.some((p) => p.route_key === parent && p[flag])) {
      return true;
    }
    return false;
  };

  const canView = (routeKey: string): boolean => {
    if (isAdmin) return true;
    if (routeKey === "dashboard") return true;
    if (isFormateur) {
      return routeKey === "evaluations" || routeKey.startsWith("evaluations.");
    }
    if (routeKey === "admin") return false;
    if (routeKey === "monitoramento") return false;
    return hasFlag(routeKey, "can_view");
  };

  const canEdit = (routeKey: string): boolean => {
    if (isAdmin) return true;
    if (isFormateur) {
      return routeKey === "evaluations" || routeKey.startsWith("evaluations.");
    }
    if (routeKey === "admin" || routeKey === "monitoramento" || routeKey === "dashboard") return false;
    return hasFlag(routeKey, "can_edit");
  };

  return {
    isAdmin,
    isFormateur,
    canView,
    canEdit,
    loading:
      !!user &&
      (rolePending ||
        role === undefined ||
        (permsPending && !isAdmin && !isFormateur && role != null)),
    role,
  };
}

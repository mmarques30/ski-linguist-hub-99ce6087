import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUserPermissions() {
  const { user } = useAuth();

  // Même clé que ProtectedRoute pour partager le cache (évite course SPA Assister).
  const { data: role, isPending: rolePending } = useQuery({
    queryKey: ["user-role-check", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.role ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = role === "admin";
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

  const canView = (routeKey: string): boolean => {
    if (isAdmin) return true;
    if (isFormateur) return routeKey === "evaluations";
    return permissions.some((p) => p.route_key === routeKey && p.can_view);
  };

  const canEdit = (routeKey: string): boolean => {
    if (isAdmin) return true;
    if (isFormateur) return routeKey === "evaluations";
    return permissions.some((p) => p.route_key === routeKey && p.can_edit);
  };

  return {
    isAdmin,
    isFormateur,
    canView,
    canEdit,
    // Sans user : ne pas bloquer (la garde auth gère). Avec user : attendre le rôle
    // via isPending (v5) — isLoading est false sur query désactivée et faisait
    // rediriger trop tôt les routes Assister en navigation SPA.
    loading:
      !!user &&
      (rolePending ||
        role === undefined ||
        (permsPending && !isAdmin && !isFormateur && role != null)),
    role,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useUserPermissions() {
  const { user } = useAuth();

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role", user?.id],
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

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_permissions")
        .select("route_key, can_view, can_edit")
        .eq("user_id", user.id);
      return data ?? [];
    },
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const canView = (routeKey: string): boolean => {
    if (isAdmin) return true;
    return permissions.some((p) => p.route_key === routeKey && p.can_view);
  };

  const canEdit = (routeKey: string): boolean => {
    if (isAdmin) return true;
    return permissions.some((p) => p.route_key === routeKey && p.can_edit);
  };

  return {
    isAdmin,
    canView,
    canEdit,
    loading: roleLoading || permsLoading,
    role,
  };
}

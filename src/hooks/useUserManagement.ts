import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: string | null;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "user";
  permissions: { route_key: string; can_view: boolean; can_edit: boolean }[];
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, created_at")
        .order("created_at", { ascending: false });

      if (!profiles) return [];

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map<string, string>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role));

      return profiles.map((p) => ({
        ...p,
        is_active: p.is_active ?? true,
        role: roleMap.get(p.id) ?? "user",
      })) as UserWithRole[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("create-user", {
        body: input,
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: { route_key: string; can_view: boolean; can_edit: boolean }[];
    }) => {
      // Delete existing then insert new
      await supabase.from("user_permissions").delete().eq("user_id", userId);
      if (permissions.length > 0) {
        const rows = permissions.map((p) => ({ user_id: userId, ...p }));
        const { error } = await supabase.from("user_permissions").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const toggleUserActive = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return { users, isLoading, createUser, updatePermissions, toggleUserActive };
}

export function useUserPermissionsForUser(userId: string | null) {
  return useQuery({
    queryKey: ["user-permissions-admin", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("user_permissions")
        .select("route_key, can_view, can_edit")
        .eq("user_id", userId);
      return data ?? [];
    },
    enabled: !!userId,
  });
}

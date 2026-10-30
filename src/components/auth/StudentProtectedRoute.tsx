import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";
import { fetchEffectiveAppRole } from "@/lib/app-role";

interface Props {
  children: React.ReactNode;
}

export function StudentProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-check", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return fetchEffectiveAppRole(supabase, user.id);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?mode=student", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && role && role !== "student") {
      // Not a student — redirect to admin dashboard
      navigate(ADMIN_HOME_PATH, { replace: true });
    }
  }, [role, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-pill border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

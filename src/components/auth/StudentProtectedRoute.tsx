import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?mode=student", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && role && role !== "student") {
      // Not a student — redirect to admin dashboard
      navigate("/", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

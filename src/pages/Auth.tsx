import { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { StudentAuthCard } from "@/components/auth/StudentAuthCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/fli-auth-bg.png";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStudentMode = searchParams.get("mode") === "student";

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
  });

  useEffect(() => {
    if (!loading && !roleLoading && user) {
      navigate(role === "student" ? "/student/dashboard" : "/", { replace: true });
    }
  }, [user, loading, roleLoading, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background image with blur */}
      <div
        className="absolute inset-0 -m-4 bg-cover bg-center blur-sm scale-105"
        style={{ backgroundImage: `url(${authBg})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {isStudentMode ? <StudentAuthCard /> : <AuthCard />}

        <div className="mt-8 text-center space-y-2">
          {!isStudentMode && (
            <Link
              to="/auth?mode=student"
              className="block text-sm text-white/80 hover:text-white transition-colors"
            >
              Espace stagiaire
            </Link>
          )}
          {isStudentMode && (
            <Link
              to="/auth"
              className="block text-sm text-white/80 hover:text-white transition-colors"
            >
              Connexion administrateur
            </Link>
          )}
          <Link
            to="/register"
            className="block text-sm text-white/80 hover:text-white transition-colors"
          >
            Formulaire d&apos;inscription publique
          </Link>
        </div>
      </div>
      
      <footer className="absolute bottom-4 z-10 text-center">
        <p className="text-xs text-white/60">
          France Langues International
        </p>
      </footer>
    </div>
  );
}
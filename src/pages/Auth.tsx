import { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GraduationCap, ShieldCheck, ClipboardList } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { StudentAuthCard } from "@/components/auth/StudentAuthCard";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import authBg from "@/assets/fli-auth-bg.png";
import { ADMIN_HOME_PATH } from "@/lib/admin-home";

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
      const home =
        role === "student"
          ? "/student/dashboard"
          : role === "formateur"
            ? "/formateur/evaluations"
            : ADMIN_HOME_PATH;
      navigate(home, { replace: true });
    }
  }, [user, loading, roleLoading, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Photo de fond floutée */}
      <div
        className="absolute inset-0 -m-4 scale-105 bg-cover bg-center blur-sm"
        style={{ backgroundImage: `url(${authBg})` }}
        aria-hidden
      />
      {/* Voile teinté navy — jeton de marque, pas une couleur en dur */}
      <div className="absolute inset-0 bg-[hsl(var(--fli-navy))]/55" aria-hidden />

      {/* Contenu */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        {isStudentMode ? <StudentAuthCard /> : <AuthCard />}

        {/* Les deux parcours restent visibles : staff et stagiaire. */}
        <nav
          aria-label="Autres accès"
          className="fli-glass w-full rounded-[var(--radius-card)] border border-border/60 p-2 shadow-md"
        >
          <ul className="flex flex-col gap-1">
            {!isStudentMode && (
              <li>
                <Link
                  to="/auth?mode=student"
                  className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                >
                  <GraduationCap className="h-4 w-4 shrink-0 text-[hsl(var(--tint-blue-fg))]" />
                  Espace stagiaire
                </Link>
              </li>
            )}
            {isStudentMode && (
              <li>
                <Link
                  to="/auth"
                  className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[hsl(var(--surface-sunken))]"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[hsl(var(--tint-navy-fg))]" />
                  Connexion administrateur
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/register"
                className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-[hsl(var(--tint-gold-fg))]" />
                Formulaire d&apos;inscription publique
              </Link>
            </li>
          </ul>
        </nav>

        <footer className="text-center">
          <p className="fli-glass inline-block rounded-pill border border-border/60 px-3 py-1 text-xs text-muted-foreground">
            France Langues International
          </p>
        </footer>
      </div>
    </div>
  );
}

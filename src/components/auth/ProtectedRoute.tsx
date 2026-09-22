import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { resolveRouteKey, routeKeyLabel } from "@/lib/route-permissions";
import { AccessDenied } from "@/components/auth/AccessDenied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Clé explicite ; sinon dérivée du pathname. */
  routeKey?: string;
}

export function ProtectedRoute({ children, routeKey: routeKeyProp }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    canView,
    loading: permsLoading,
    role,
  } = useUserPermissions();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!permsLoading && role === "student") {
      navigate("/student/dashboard", { replace: true });
    }
  }, [role, permsLoading, navigate]);

  useEffect(() => {
    if (
      !permsLoading &&
      role === "formateur" &&
      !location.pathname.startsWith("/formateur") &&
      !location.pathname.startsWith("/portails/formateur")
    ) {
      navigate("/formateur/evaluations", { replace: true });
    }
  }, [role, permsLoading, location.pathname, navigate]);

  if (loading || (user && permsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-pill border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user || role === "student") {
    return null;
  }

  if (
    role === "formateur" &&
    !location.pathname.startsWith("/formateur") &&
    !location.pathname.startsWith("/portails/formateur")
  ) {
    return null;
  }

  const resolvedKey = routeKeyProp ?? resolveRouteKey(location.pathname);
  // Clé présente → canView obligatoire (permissions = sécurité).
  if (resolvedKey && !canView(resolvedKey)) {
    return <AccessDenied routeLabel={routeKeyLabel(resolvedKey)} />;
  }

  return <>{children}</>;
}

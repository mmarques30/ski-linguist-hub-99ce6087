import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface Props {
  children: React.ReactNode;
}

/**
 * Garde staff pour le mode Assister stagiaire.
 * Admin et users staff (rôle != student/formateur) peuvent ouvrir le portail.
 */
export function AssistStudentRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isFormateur, role, loading: permsLoading } = useUserPermissions();

  const isStaff = isAdmin || (!!role && role !== "student" && !isFormateur);
  const roleResolved = role !== undefined;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !permsLoading && roleResolved && user && !isStaff) {
      navigate("/", { replace: true });
    }
  }, [user, loading, permsLoading, roleResolved, isStaff, navigate]);

  if (loading || permsLoading || (user && !roleResolved)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isStaff) return null;

  return <>{children}</>;
}

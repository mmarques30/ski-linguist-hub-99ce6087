import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface Props {
  children: React.ReactNode;
}

/** Garde staff pour Assister formateur. */
export function AssistFormateurRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isFormateur, role, loading: permsLoading } = useUserPermissions();

  const isStaff = isAdmin || (!!role && role !== "student" && !isFormateur);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !permsLoading && user && !isStaff) {
      navigate("/", { replace: true });
    }
  }, [user, loading, permsLoading, isStaff, navigate]);

  if (loading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isStaff) return null;

  return <>{children}</>;
}

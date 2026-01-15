import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <AuthCard />
      
      <div className="mt-8 text-center">
        <Link 
          to="/register" 
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Formulaire d'inscription publique
        </Link>
      </div>
      
      <footer className="absolute bottom-4 text-center">
        <p className="text-xs text-muted-foreground">
          France Langues International
        </p>
      </footer>
    </div>
  );
}

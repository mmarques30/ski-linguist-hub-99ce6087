import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthCard } from "@/components/auth/AuthCard";
import { useAuth } from "@/hooks/useAuth";
import authBg from "@/assets/fli-auth-bg.png";

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
        <AuthCard />
        
        <div className="mt-8 text-center">
          <Link 
            to="/register" 
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Formulaire d'inscription publique
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
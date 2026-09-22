import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/common/EmptyState";

const translations = {
  title: {
    fr: "Page introuvable",
    "pt-BR": "Página não encontrada",
    en: "Page not found",
  },
  description: {
    fr: "Cette adresse ne correspond à aucune page de l'application.",
    "pt-BR": "Este endereço não corresponde a nenhuma página do aplicativo.",
    en: "This address does not match any page of the application.",
  },
  back: {
    fr: "Retour à l'accueil",
    "pt-BR": "Voltar ao início",
    en: "Back to home",
  },
};

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-page))] p-4">
      <div className="w-full max-w-md space-y-4">
        <p className="text-center text-metric tabular text-muted-foreground">404</p>

        <EmptyState
          icon={Compass}
          title={t(translations.title)}
          description={t(translations.description)}
          className="bg-card"
        >
          <code className="mt-4 block w-full break-all rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] px-3 py-2 text-xs text-muted-foreground">
            {location.pathname}
          </code>
          <Button asChild className="mt-5 h-11 w-full sm:w-auto">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t(translations.back)}
            </Link>
          </Button>
        </EmptyState>
      </div>
    </div>
  );
};

export default NotFound;

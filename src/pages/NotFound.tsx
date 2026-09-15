import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl font-medium">{t(translations.title)}</p>
        <p className="text-muted-foreground">{t(translations.description)}</p>
        <code className="block break-all rounded bg-background px-3 py-2 text-xs text-muted-foreground">
          {location.pathname}
        </code>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(translations.back)}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

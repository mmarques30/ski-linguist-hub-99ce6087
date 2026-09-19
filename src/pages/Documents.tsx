import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmptyState } from "@/components/common/EmptyState";

const translations = {
  title: {
    fr: "Documents",
    "pt-BR": "Documentos",
    en: "Documents",
  },
  subtitle: {
    fr: "Les documents sont gérés par inscription (pack d'accueil et pack de fin de formation)",
    "pt-BR": "Os documentos são gerenciados por inscrição (pacote de boas-vindas e pacote de encerramento)",
    en: "Documents are managed per enrollment (welcome pack and end-of-training pack)",
  },
  noDocumentsTitle: {
    fr: "Documents par inscription",
    "pt-BR": "Documentos por inscrição",
    en: "Per-enrollment documents",
  },
  noDocumentsDesc: {
    fr: "Il n'y a pas de bibliothèque centrale sur cette page. Consultez la fiche de chaque inscription (onglet Documents) pour les packs d'accueil et de fin de formation, ou configurez les modèles d'envoi.",
    "pt-BR": "Não há biblioteca central nesta página. Consulte a ficha de cada inscrição (aba Documentos) para os pacotes de boas-vindas e de encerramento, ou configure os modelos de envio.",
    en: "There is no central library on this page. Open each enrollment (Documents tab) for welcome and end-of-training packs, or configure send templates.",
  },
  linkInscriptions: {
    fr: "Voir les inscriptions",
    "pt-BR": "Ver inscrições",
    en: "View enrollments",
  },
  linkTemplates: {
    fr: "Modèles d'inscription",
    "pt-BR": "Modelos de inscrição",
    en: "Enrollment templates",
  },
};

export default function Documents() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
          <p className="text-muted-foreground">{t(translations.subtitle)}</p>
        </div>

        <EmptyState
          icon={FileText}
          title={t(translations.noDocumentsTitle)}
          description={t(translations.noDocumentsDesc)}
        >
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="default">
              <Link to="/inscriptions">{t(translations.linkInscriptions)}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/registration-documents">{t(translations.linkTemplates)}</Link>
            </Button>
          </div>
        </EmptyState>
      </div>
    </MainLayout>
  );
}

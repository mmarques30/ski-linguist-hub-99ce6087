import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Info, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";

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
  notConnected: {
    fr: "Bibliothèque non connectée",
    "pt-BR": "Biblioteca não conectada",
    en: "Library not connected",
  },
  whereToLook: {
    fr: "Où trouver les documents",
    "pt-BR": "Onde encontrar os documentos",
    en: "Where to find documents",
  },
};

/**
 * Page Documents — écran d'aiguillage.
 *
 * Aucune bibliothèque centrale n'est branchée ici : la page n'affiche donc
 * aucune liste simulée. Elle dit explicitement où vivent réellement les
 * documents (fiche d'inscription) et mène aux deux écrans qui les portent.
 */
export default function Documents() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={FileText}
          tone="blue"
          meta={
            <StatusPill tone="warning" icon={Info}>
              {t(translations.notConnected)}
            </StatusPill>
          }
          actions={
            <>
              <Button asChild>
                <Link to="/inscriptions">
                  {t(translations.linkInscriptions)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/registration-documents">
                  <Settings2 className="mr-2 h-4 w-4" />
                  {t(translations.linkTemplates)}
                </Link>
              </Button>
            </>
          }
        />

        <SurfaceCard title={t(translations.whereToLook)} flush>
          <TableEmpty
            icon={FileText}
            title={t(translations.noDocumentsTitle)}
            description={t(translations.noDocumentsDesc)}
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild>
                  <Link to="/inscriptions">{t(translations.linkInscriptions)}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/registration-documents">
                    {t(translations.linkTemplates)}
                  </Link>
                </Button>
              </div>
            }
          />
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

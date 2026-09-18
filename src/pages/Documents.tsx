import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload, Search, FolderOpen, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { EmptyState } from "@/components/common/EmptyState";

const translations = {
  title: {
    fr: "Documents",
    "pt-BR": "Documentos",
    en: "Documents",
  },
  subtitle: {
    fr: "Gérez les documents informatifs et ressources pour les stagiaires",
    "pt-BR": "Gerencie documentos informativos e recursos para estagiários",
    en: "Manage informative documents and resources for students",
  },
  uploadDocument: {
    fr: "Téléverser un document",
    "pt-BR": "Enviar documento",
    en: "Upload Document",
  },
  searchPlaceholder: {
    fr: "Rechercher des documents...",
    "pt-BR": "Buscar documentos...",
    en: "Search documents...",
  },
  files: {
    fr: "fichiers",
    "pt-BR": "arquivos",
    en: "files",
  },
  allDocuments: {
    fr: "Tous les documents",
    "pt-BR": "Todos os documentos",
    en: "All Documents",
  },
  allDocumentsDesc: {
    fr: "Parcourez et gérez tous les documents téléversés",
    "pt-BR": "Navegue e gerencie todos os documentos enviados",
    en: "Browse and manage all uploaded documents",
  },
  noDocumentsTitle: {
    fr: "Bibliothèque documents non branchée",
    "pt-BR": "Biblioteca de documentos ainda não ligada",
    en: "Document library not connected",
  },
  noDocumentsDesc: {
    fr: "Cette page est une maquette : aucun fichier n'est stocké ici. Les envois par inscription restent dans la fiche inscription (onglet Documents).",
    "pt-BR": "Esta página é uma maquete: nenhum arquivo é armazenado aqui. Os envios por inscrição ficam na ficha (aba Documentos).",
    en: "This page is a mockup: no files are stored here. Per-enrollment sends remain on the enrollment Documents tab.",
  },
  // Categories
  catFifpl: {
    fr: "Financement FIFPL",
    "pt-BR": "Financiamento FIFPL",
    en: "FIFPL Funding",
  },
  catFifplDesc: {
    fr: "Documents relatifs aux critères et processus de financement FIFPL",
    "pt-BR": "Documentos relacionados aos critérios e processos de financiamento FIFPL",
    en: "Documents related to FIFPL funding criteria and processes",
  },
  catReimbursement: {
    fr: "Tutoriels remboursement",
    "pt-BR": "Tutoriais de reembolso",
    en: "Reimbursement Tutorials",
  },
  catReimbursementDesc: {
    fr: "Guides étape par étape pour les demandes de remboursement",
    "pt-BR": "Guias passo a passo para solicitações de reembolso",
    en: "Step-by-step guides for reimbursement requests",
  },
  catMicroEnterprise: {
    fr: "Info Micro-entreprise",
    "pt-BR": "Info Microempresa",
    en: "Micro-enterprise Info",
  },
  catMicroEnterpriseDesc: {
    fr: "Informations sur les plafonds de prise en charge pour micro-entreprises",
    "pt-BR": "Informações sobre limites de cobertura para microempresas",
    en: "Information on coverage limits for micro-enterprises",
  },
  catCertificates: {
    fr: "Certificats",
    "pt-BR": "Certificados",
    en: "Certificates",
  },
  catCertificatesDesc: {
    fr: "Attestations CFP et certificats de langues",
    "pt-BR": "Atestados CFP e certificados de idiomas",
    en: "CFP attestations and language certificates",
  },
  comingSoon: {
    fr: "Catégorie prévue — pas encore de fichiers",
    "pt-BR": "Categoria prevista — ainda sem arquivos",
    en: "Planned category — no files yet",
  },
  bannerTitle: {
    fr: "Module en construction",
    "pt-BR": "Módulo em construção",
    en: "Module under construction",
  },
  bannerDesc: {
    fr: "Téléversement, recherche et téléchargement ne sont pas encore disponibles. Utilisez les documents liés à chaque inscription.",
    "pt-BR": "Upload, busca e download ainda não estão disponíveis. Use os documentos de cada inscrição.",
    en: "Upload, search and download are not available yet. Use documents on each enrollment.",
  },
};

export default function Documents() {
  const { t } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("documents");

  const documentCategories = [
    {
      name: t(translations.catFifpl),
      description: t(translations.catFifplDesc),
      count: 0,
    },
    {
      name: t(translations.catReimbursement),
      description: t(translations.catReimbursementDesc),
      count: 0,
    },
    {
      name: t(translations.catMicroEnterprise),
      description: t(translations.catMicroEnterpriseDesc),
      count: 0,
    },
    {
      name: t(translations.catCertificates),
      description: t(translations.catCertificatesDesc),
      count: 0,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">{t(translations.subtitle)}</p>
          </div>
          {editable && (
            <Button disabled title={t(translations.bannerDesc)}>
              <Upload className="mr-2 h-4 w-4" />
              {t(translations.uploadDocument)}
            </Button>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t(translations.bannerTitle)}</AlertTitle>
          <AlertDescription>{t(translations.bannerDesc)}</AlertDescription>
        </Alert>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t(translations.searchPlaceholder)}
            className="pl-10"
            disabled
            title={t(translations.bannerDesc)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documentCategories.map((category) => (
            <Card key={category.name} className="opacity-90">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {category.count} {t(translations.files)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{category.description}</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">{t(translations.comingSoon)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t(translations.allDocuments)}</CardTitle>
            <CardDescription>{t(translations.allDocumentsDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title={t(translations.noDocumentsTitle)}
              description={t(translations.noDocumentsDesc)}
              className="border-0 bg-transparent py-10"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

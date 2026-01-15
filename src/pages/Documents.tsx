import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Upload, Search, Eye, Trash2, FolderOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    fr: "Aucun document téléversé",
    "pt-BR": "Nenhum documento enviado",
    en: "No documents uploaded",
  },
  noDocumentsDesc: {
    fr: "Téléversez votre premier document pour commencer à organiser vos ressources.",
    "pt-BR": "Envie seu primeiro documento para começar a organizar seus recursos.",
    en: "Upload your first document to start organizing your resources.",
  },
  downloads: {
    fr: "téléchargements",
    "pt-BR": "downloads",
    en: "downloads",
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
};

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  uploadedAt: string;
  downloads: number;
}

const documents: Document[] = [];

export default function Documents() {
  const { t } = useLanguage();

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">
              {t(translations.subtitle)}
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            {t(translations.uploadDocument)}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t(translations.searchPlaceholder)} className="pl-10" />
        </div>

        {/* Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {documentCategories.map((category) => (
            <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>{t(translations.allDocuments)}</CardTitle>
            <CardDescription>
              {t(translations.allDocumentsDesc)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">{t(translations.noDocumentsTitle)}</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  {t(translations.noDocumentsDesc)}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{doc.category}</span>
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>{doc.downloads} {t(translations.downloads)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Upload, Search, Eye, Trash2, FolderOpen } from "lucide-react";

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  uploadedAt: string;
  downloads: number;
}

const documentCategories = [
  {
    name: "Financement FIFPL",
    description: "Documents relatifs aux critères et processus de financement FIFPL",
    count: 0,
  },
  {
    name: "Tutoriels remboursement",
    description: "Guides étape par étape pour les demandes de remboursement",
    count: 0,
  },
  {
    name: "Info Micro-entreprise",
    description: "Informations sur les plafonds de prise en charge pour micro-entreprises",
    count: 0,
  },
  {
    name: "Certificats",
    description: "Attestations CFP et certificats de langues",
    count: 0,
  },
];

const documents: Document[] = [];

export default function Documents() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground">
              Gérez les documents informatifs et ressources pour les stagiaires
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Téléverser un document
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher des documents..." className="pl-10" />
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
                      {category.count} fichiers
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
            <CardTitle>Tous les documents</CardTitle>
            <CardDescription>
              Parcourez et gérez tous les documents téléversés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Aucun document téléversé</h3>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  Téléversez votre premier document pour commencer à organiser vos ressources.
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
                          <span>{doc.downloads} téléchargements</span>
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

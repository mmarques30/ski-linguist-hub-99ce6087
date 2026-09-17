import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useClearRegistrationTemplateOverride,
  useDownloadRegistrationTemplate,
  useRegistrationDocumentTemplates,
  useReplaceRegistrationTemplate,
} from "@/hooks/useRegistrationDocumentTemplates";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Download, FileText, Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminRegistrationDocuments() {
  const { isAdmin, loading } = useUserPermissions();
  const { data: templates, isLoading, error } = useRegistrationDocumentTemplates();
  const download = useDownloadRegistrationTemplate();
  const replace = useReplaceRegistrationTemplate();
  const clearOverride = useClearRegistrationTemplateOverride();
  const [busyFile, setBusyFile] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <Alert variant="destructive">
          <AlertTitle>Accès réservé</AlertTitle>
          <AlertDescription>
            Seul un compte administrateur peut gérer les modèles de documents
            d&apos;inscription.
          </AlertDescription>
        </Alert>
      </MainLayout>
    );
  }

  const handleDownload = async (internalFile: string) => {
    setBusyFile(internalFile);
    try {
      const url = await download.mutateAsync(internalFile);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléchargement impossible");
    } finally {
      setBusyFile(null);
    }
  };

  const handleReplace = async (internalFile: string, file: File | undefined) => {
    if (!file) return;
    setBusyFile(internalFile);
    try {
      await replace.mutateAsync({ internalFile, file });
      toast.success("Modèle remplacé — utilisé pour les prochains envois");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remplacement refusé");
    } finally {
      setBusyFile(null);
      const input = inputRefs.current[internalFile];
      if (input) input.value = "";
    }
  };

  const handleClear = async (internalFile: string) => {
    setBusyFile(internalFile);
    try {
      await clearOverride.mutateAsync(internalFile);
      toast.success("Version déposée retirée — retour au modèle livré avec l'app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setBusyFile(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Modèles documents d&apos;inscription</h1>
          <p className="text-muted-foreground mt-1">
            Fichiers joints après inscription (critères FIF-PL, convention, programme).
            Les textes d&apos;email se gèrent à part sur{" "}
            <Link to="/admin/emails" className="underline underline-offset-2">
              /admin/emails
            </Link>
            .
          </p>
        </div>

        <Alert>
          <AlertTitle>Comment ça fonctionne</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Par défaut, l&apos;app utilise les trois fichiers livrés avec le code. Si vous
              déposez une nouvelle version ici, elle est stockée de façon privée et
              utilisée pour les prochains envois (pack moniteur / dossier de formation).
            </p>
            <p>
              Étape suivante prévue : générer convention et programme à partir des
              données de chaque inscription (modèle email « Dossier de formation »).
            </p>
          </AlertDescription>
        </Alert>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm">
            Impossible de lire le stockage :{" "}
            {error instanceof Error ? error.message : "erreur"}
          </p>
        )}

        <div className="grid gap-4">
          {(templates ?? []).map((doc) => {
            const busy = busyFile === doc.internalFile;
            return (
              <Card key={doc.internalFile}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.label}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {doc.filename}
                      </CardDescription>
                    </div>
                    {doc.hasOverride ? (
                      <Badge>Version déposée</Badge>
                    ) : (
                      <Badge variant="outline">Version livrée</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  {doc.hasOverride && doc.updatedAt && (
                    <p className="text-xs text-muted-foreground w-full mb-1">
                      Déposée le{" "}
                      {format(new Date(doc.updatedAt), "d MMMM yyyy à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleDownload(doc.internalFile)}
                  >
                    {busy && download.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Télécharger
                  </Button>
                  <input
                    ref={(el) => {
                      inputRefs.current[doc.internalFile] = el;
                    }}
                    type="file"
                    className="hidden"
                    accept={
                      doc.internalFile.endsWith(".pdf")
                        ? "application/pdf,.pdf"
                        : ".dotx,application/vnd.openxmlformats-officedocument.wordprocessingml.template"
                    }
                    onChange={(e) =>
                      void handleReplace(doc.internalFile, e.target.files?.[0])
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => inputRefs.current[doc.internalFile]?.click()}
                  >
                    {busy && replace.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Remplacer
                  </Button>
                  {doc.hasOverride && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void handleClear(doc.internalFile)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Revenir à la version livrée
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

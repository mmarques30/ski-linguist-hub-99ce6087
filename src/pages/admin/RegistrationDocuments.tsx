import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGrid,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
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
        <PageShell>
          <div className="space-y-4" aria-busy="true">
            <span className="sr-only">Chargement…</span>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
            <Skeleton className="h-24 w-full rounded-[var(--radius-card)]" />
          </div>
        </PageShell>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <PageShell>
          <Alert variant="destructive">
            <AlertTitle>Accès réservé</AlertTitle>
            <AlertDescription>
              Seul un compte administrateur peut gérer les modèles de documents
              d&apos;inscription.
            </AlertDescription>
          </Alert>
        </PageShell>
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
      <PageShell>
        <PageHeader
          title="Modèles documents d'inscription"
          icon={FileText}
          tone="teal"
          description={
            <>
              Fichiers du dossier d&apos;inscription (critères FIF-PL, tutoriel, modèles
              convention / programme).
              Les textes d&apos;email se gèrent à part sur{" "}
              <Link to="/admin/emails" className="underline underline-offset-2">
                /admin/emails
              </Link>
              .
            </>
          }
        />

        <Alert>
          <AlertTitle>Comment ça fonctionne</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Par défaut, l&apos;app utilise les fichiers livrés avec le code pour les
              pièces jointes statiques (critères FIF-PL et tutoriel). Les modèles Word
              restent téléchargeables ici ; la convention et le programme du dossier de
              formation sont générés automatiquement en PDF à partir de chaque
              inscription (envoi +30 min, modèle email « Dossier de formation »,
              payeur stagiaire uniquement).
            </p>
            <p>
              Si vous déposez une nouvelle version des critères ou du tutoriel ici, elle
              est stockée de façon privée et utilisée pour les prochains envois.
            </p>
          </AlertDescription>
        </Alert>

        {isLoading && (
          <CardGrid cols={2}>
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-card)]" />
            ))}
          </CardGrid>
        )}

        {error && (
          <p className="text-sm text-destructive">
            Impossible de lire le stockage :{" "}
            {error instanceof Error ? error.message : "erreur"}
          </p>
        )}

        {!isLoading && !error && (templates ?? []).length === 0 && (
          <SurfaceCard flush>
            <TableEmpty
              title="Aucun modèle de document"
              description="Aucun fichier n'est déclaré pour le dossier d'inscription."
              icon={FileText}
            />
          </SurfaceCard>
        )}

        <CardGrid cols={2}>
          {(templates ?? []).map((doc) => {
            const busy = busyFile === doc.internalFile;
            return (
              <SurfaceCard
                key={doc.internalFile}
                title={doc.label}
                icon={FileText}
                description={<span className="font-mono text-xs">{doc.filename}</span>}
                actions={
                  doc.hasOverride ? (
                    <StatusPill tone="info" dot>Version déposée</StatusPill>
                  ) : (
                    <StatusPill tone="neutral">Version livrée</StatusPill>
                  )
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  {doc.hasOverride && doc.updatedAt && (
                    <p className="mb-1 w-full text-xs text-muted-foreground">
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
                </div>
              </SurfaceCard>
            );
          })}
        </CardGrid>
      </PageShell>
    </MainLayout>
  );
}

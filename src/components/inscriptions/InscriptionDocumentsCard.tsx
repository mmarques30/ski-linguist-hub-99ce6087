import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, ExternalLink, FileText, Loader2, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptionDocuments } from "@/hooks/useInscriptionDocuments";
import {
  DOCUMENT_TYPE_LABELS,
  expectsSkiMonitorWelcomePack,
  getRegistrationDocumentPublicUrl,
  REGISTRATION_WELCOME_DOCUMENTS,
} from "@/lib/registration-welcome-documents";

interface InscriptionDocumentsCardProps {
  inscriptionId: string;
  modality?: string | null;
  courseLocation?: string | null;
  observations?: string | null;
  studentEmail?: string | null;
}

export function InscriptionDocumentsCard({
  inscriptionId,
  modality,
  courseLocation,
  observations,
  studentEmail,
}: InscriptionDocumentsCardProps) {
  const { language } = useLanguage();
  const { data: sendings = [], isLoading } = useInscriptionDocuments(inscriptionId);

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;
  const latestSentAt = sendings[0]?.sent_at ?? null;

  const formatSentAt = (value: string) => {
    try {
      return format(new Date(value), "dd MMM yyyy à HH:mm", { locale: dateLocale });
    } catch {
      return value;
    }
  };

  const showWelcomePack = expectsSkiMonitorWelcomePack({
    modality,
    courseLocation,
    observations,
  });

  const sentTypes = new Set(sendings.map((s) => s.document_type));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {latestSentAt && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Pack d&apos;inscription envoyé le {formatSentAt(latestSentAt)}
            {(studentEmail || sendings[0]?.sent_to) ? ` à ${studentEmail || sendings[0]?.sent_to}` : ""}.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents envoyés au stagiaire</CardTitle>
          <CardDescription>
            Historique des envois automatiques liés à cette inscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sendings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun document envoyé pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {sendings.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <p className="font-medium">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </p>
                      <Badge variant="secondary">Envoyé</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatSentAt(doc.sent_at)} · {doc.sent_to}
                    </p>
                  </div>
                  {doc.pdf_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.pdf_url} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showWelcomePack && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pack moniteur de ski — formation en ligne</CardTitle>
            <CardDescription>
              Documents envoyés automatiquement à l&apos;inscription (ou à renvoyer manuellement)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {REGISTRATION_WELCOME_DOCUMENTS.map((doc) => {
              const wasSent = sentTypes.has(doc.documentType);
              const publicUrl = getRegistrationDocumentPublicUrl(doc.internalFile);

              return (
                <div
                  key={doc.documentType}
                  className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.label}</p>
                      <Badge variant={wasSent ? "default" : "outline"}>
                        {wasSent ? "Envoyé" : "En attente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.filename}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir
                    </a>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

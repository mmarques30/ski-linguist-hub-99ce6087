import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, FileText, Mail, AlertTriangle } from "lucide-react";
import { CertificatePdfButton } from "@/components/certificates/CertificatePdfButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptionDocuments } from "@/hooks/useInscriptionDocuments";
import {
  useInscriptionCertificates,
  useInscriptionProgression,
} from "@/hooks/useInscriptionProgression";
import {
  DOCUMENT_TYPE_LABELS,
  expectsSkiMonitorWelcomePack,
  getRegistrationDocumentPublicUrl,
  REGISTRATION_WELCOME_DOCUMENTS,
} from "@/lib/registration-welcome-documents";
import {
  isEntryFormComplete,
  isExitFormComplete,
  listMissingFormationDocuments,
} from "@/lib/certificate-progression";

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
  const { data: progression } = useInscriptionProgression(inscriptionId);
  const { data: certificates = [] } = useInscriptionCertificates(inscriptionId);

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;
  const latestSentAt = sendings[0]?.sent_at ?? null;

  const expectExitDocuments = (() => {
    if (!progression) return false;
    if (["terminee", "facturee"].includes(progression.status)) return true;
    if (progression.end_date) {
      return new Date(progression.end_date) <= new Date();
    }
    return false;
  })();

  const missingDocs = progression
    ? listMissingFormationDocuments({
        entryFormComplete: isEntryFormComplete(progression),
        exitFormComplete: isExitFormComplete(progression),
        hasCertificate: certificates.length > 0,
        expectExitDocuments,
      })
    : [];

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
      <SurfaceCard
        title="Documents envoyés au stagiaire"
        description="Historique des envois automatiques liés à cette inscription"
        icon={FileText}
      >
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-20 w-full rounded-[var(--radius)]" />
          ))}
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {missingDocs.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Documents manquants</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc pl-4 space-y-1">
              {missingDocs.map((doc) => (
                <li key={doc.code}>
                  <span className="font-medium">{doc.label}</span>
                  {" — "}
                  {doc.reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {latestSentAt && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            {sendings.some((s) =>
              ["CERTIFICAT", "FACTURE", "ATTESTATION_PRESENCE"].includes(s.document_type)
            )
              ? "Pack de fin de formation envoyé"
              : "Pack d'inscription envoyé"}{" "}
            le {formatSentAt(latestSentAt)}
            {(studentEmail || sendings[0]?.sent_to) ? ` à ${studentEmail || sendings[0]?.sent_to}` : ""}.
          </AlertDescription>
        </Alert>
      )}

      <SurfaceCard
        title="Documents envoyés au stagiaire"
        description="Historique des envois automatiques liés à cette inscription"
        icon={FileText}
      >
        {sendings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun document envoyé pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {sendings.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-3 rounded-[var(--radius)] border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <p className="font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </p>
                    <StatusPill tone="success" size="sm">
                      Envoyé
                    </StatusPill>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatSentAt(doc.sent_at)} · {doc.sent_to}
                  </p>
                </div>
                {doc.pdf_url && (
                  <CertificatePdfButton pathOrUrl={doc.pdf_url} />
                )}
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>

      {showWelcomePack && (
        <SurfaceCard
          title={"Pack moniteur de ski — documents d’inscription"}
          description="Envoyés automatiquement à toute inscription moniteur de ski (hors devis / format personnalisé) — ou à renvoyer manuellement"
          icon={FileText}
        >
          <ul className="space-y-3">
            {REGISTRATION_WELCOME_DOCUMENTS.map((doc) => {
              const wasSent = sentTypes.has(doc.documentType);
              const publicUrl = getRegistrationDocumentPublicUrl(doc.internalFile);

              return (
                <li
                  key={doc.documentType}
                  className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{doc.label}</p>
                      <StatusPill tone={wasSent ? "success" : "warning"} size="sm">
                        {wasSent ? "Envoyé" : "En attente"}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-muted-foreground">{doc.filename}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir
                    </a>
                  </Button>
                </li>
              );
            })}
          </ul>
        </SurfaceCard>
      )}
    </div>
  );
}

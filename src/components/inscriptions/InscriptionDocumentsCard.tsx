import { useState } from "react";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExternalLink, FileText, Mail, AlertTriangle, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormationDocumentDownloadButton } from "@/components/documents/FormationDocumentDownloadButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInscriptionDocuments } from "@/hooks/useInscriptionDocuments";
import { useSendInscriptionDocuments } from "@/hooks/useSendInscriptionDocuments";
import {
  useInscriptionCertificates,
  useInscriptionProgression,
} from "@/hooks/useInscriptionProgression";
import {
  DOCUMENT_TYPE_LABELS,
  getRegistrationDocumentPublicUrl,
  resolveWelcomePackDocuments,
} from "@/lib/registration-welcome-documents";
import {
  isEntryFormComplete,
  isExitFormComplete,
  listMissingFormationDocuments,
} from "@/lib/certificate-progression";
import { PresenceFichesCard } from "@/components/inscriptions/PresenceFichesCard";

interface InscriptionDocumentsCardProps {
  inscriptionId: string;
  modality?: string | null;
  courseLocation?: string | null;
  observations?: string | null;
  fundingOrganization?: string | null;
  studentEmail?: string | null;
  inscriptionCode?: string | null;
  courseLanguage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationHours?: number | null;
  studentName?: string | null;
  studentId?: string | null;
  studentCity?: string | null;
  formateurName?: string | null;
}

export function InscriptionDocumentsCard({
  inscriptionId,
  modality,
  courseLocation,
  observations,
  fundingOrganization,
  studentEmail,
  inscriptionCode,
  courseLanguage,
  startDate,
  endDate,
  durationHours,
  studentName,
  studentId,
  studentCity,
  formateurName,
}: InscriptionDocumentsCardProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: sendings = [], isLoading } = useInscriptionDocuments(inscriptionId);
  const { data: progression } = useInscriptionProgression(inscriptionId);
  const { data: certificates = [] } = useInscriptionCertificates(inscriptionId);
  const sendDossier = useSendInscriptionDocuments();
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  const invalidateDocuments = () => {
    void queryClient.invalidateQueries({
      queryKey: ["inscription-documents", inscriptionId],
    });
  };

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;
  const latestSentAt = sendings[0]?.sent_at ?? null;
  const canSendDossier = Boolean(studentEmail?.trim());
  const sendLabel = latestSentAt ? "Renvoyer le dossier" : "Envoyer le dossier";

  const handleConfirmSend = async () => {
    try {
      await sendDossier.mutateAsync({ inscriptionId, force: true });
      toast.success(
        latestSentAt
          ? `Dossier renvoyé${studentEmail ? ` à ${studentEmail}` : ""}.`
          : `Dossier envoyé${studentEmail ? ` à ${studentEmail}` : ""}.`
      );
      setConfirmSendOpen(false);
      invalidateDocuments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi du dossier impossible");
    }
  };

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

  const welcomePack = resolveWelcomePackDocuments({
    fundingOrganization,
    modality,
    courseLocation,
    observations,
  });
  const isAgeficePack = Boolean(
    fundingOrganization?.toLowerCase().includes("agefice") ||
      observations?.toLowerCase().includes("agefice"),
  );
  const isGuidePack = Boolean(
    observations?.toLowerCase().includes("guide de montagne"),
  );
  const packTitle = isAgeficePack
    ? "Pack AGEFICE — documents d’inscription"
    : isGuidePack
      ? "Pack FIF-PL guide de montagne — documents d’inscription"
      : "Pack FIF-PL — documents d’inscription";
  const packDescription = isAgeficePack
    ? "Convention et programme en PDF personnalisé. Formulaire de demande AGEFICE et liste des pièces. Pas de critères FIF-PL."
    : isGuidePack
      ? "Convention et programme en PDF personnalisé. Critères Guides de montagne 8551ZG et tutoriel FIF-PL."
      : "Convention et programme en PDF personnalisé (données du stagiaire). Critères FIF-PL et tutoriel en PDF statiques.";

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
      <PresenceFichesCard
        inscriptionCode={inscriptionCode}
        language={courseLanguage}
        startDate={startDate}
        endDate={endDate}
        durationHours={durationHours}
        modality={modality}
        courseLocation={courseLocation}
        studentName={studentName}
        studentId={studentId}
        studentCity={studentCity}
        formateurName={formateurName}
      />

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
        actions={
          <Button
            size="sm"
            disabled={!canSendDossier || sendDossier.isPending}
            onClick={() => setConfirmSendOpen(true)}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sendDossier.isPending ? "Envoi…" : sendLabel}
          </Button>
        }
      >
        {!canSendDossier && (
          <p className="mb-3 text-sm text-muted-foreground">
            E-mail stagiaire manquant — impossible d’envoyer le dossier.
          </p>
        )}
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
                <FormationDocumentDownloadButton
                  documentSending={doc}
                  onPublished={invalidateDocuments}
                  observations={observations}
                />
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sendLabel} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {latestSentAt
                ? "Un nouveau pack (convention, programme, critères / tutoriel selon le financement) sera régénéré et renvoyé."
                : "Le pack dossier (convention, programme, critères / tutoriel selon le financement) sera généré et envoyé."}{" "}
              Destinataire : <strong>{studentEmail}</strong>
              {inscriptionCode ? ` (${inscriptionCode})` : ""}. BCC technique info@fli.fr.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendDossier.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendDossier.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmSend();
              }}
            >
              {sendDossier.isPending ? "Envoi…" : "Confirmer l’envoi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {welcomePack && (
        <SurfaceCard
          title={packTitle}
          description={packDescription}
          icon={FileText}
        >
          <ul className="space-y-3">
            {welcomePack.map((doc) => {
              const wasSent = sentTypes.has(doc.documentType);
              const sentRow = sendings.find((s) => s.document_type === doc.documentType);
              const isGenerated = doc.delivery === "generated_pdf";
              const publicUrl =
                doc.internalFile != null
                  ? getRegistrationDocumentPublicUrl(doc.internalFile)
                  : null;
              const displayName = inscriptionCode
                ? doc.filename.replace("{code}", inscriptionCode)
                : doc.filename.replace("-{code}", "").replace("{code}", "…");

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
                      {isGenerated && (
                        <StatusPill tone="info" size="sm">
                          Données stagiaire
                        </StatusPill>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{displayName}</p>
                  </div>
                  {wasSent && sentRow ? (
                    <FormationDocumentDownloadButton
                      documentSending={sentRow}
                      label="PDF"
                      onPublished={invalidateDocuments}
                      observations={observations}
                    />
                  ) : publicUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={publicUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ouvrir
                      </a>
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground sm:max-w-[14rem] sm:text-right">
                      Généré à l’envoi du dossier (après acompte).
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </SurfaceCard>
      )}
    </div>
  );
}

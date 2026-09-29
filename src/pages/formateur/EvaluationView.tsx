import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, FileText, FileDown } from "lucide-react";
import {
  useEvaluationWithBooking,
  useGenerateEvaluationPdf,
} from "@/hooks/useTestEvaluations";
import { EvaluationPDFPreview } from "@/components/evaluation/EvaluationPDFPreview";
import { CertificatePdfButton } from "@/components/certificates/CertificatePdfButton";
import { EVALUATION_PDF_BUCKET } from "@/lib/evaluation-pdf";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  PageHeader,
  PageShell,
  SegmentedControl,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";

export default function EvaluationView() {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const { isAdmin, role } = useUserPermissions();
  const { basePath, isAssistMode } = useFormateurView();
  const { data, isLoading } = useEvaluationWithBooking(evaluationId || "");
  const generatePdf = useGenerateEvaluationPdf();
  const isStaff = isAdmin || role === "user";
  const [activeTab, setActiveTab] = useState<"preview">("preview");

  if (isLoading) {
    return (
      <FormateurPageShell>
        <PageShell>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </PageShell>
      </FormateurPageShell>
    );
  }

  if (!data) {
    return (
      <FormateurPageShell>
        <PageShell>
          <SurfaceCard flush>
            <TableEmpty
              icon={FileText}
              title="Évaluation non trouvée"
              action={
                <Button
                  variant="outline"
                  onClick={() => navigate(`${basePath}/evaluations`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Button>
              }
            />
          </SurfaceCard>
        </PageShell>
      </FormateurPageShell>
    );
  }

  const { evaluation, booking } = data;

  return (
    <FormateurPageShell>
      <PageShell>

        <PageHeader
          back={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`${basePath}/evaluations`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          }
          title={`Évaluation - ${booking.candidate_name}`}
          description={booking.ski_school_name}
          icon={FileText}
          tone="gold"
          actions={
            <>
              {isStaff &&
                !isAssistMode &&
                (evaluation.status === "valide" || evaluation.status === "envoye") && (
                  <Button
                    onClick={() => void generatePdf.mutateAsync(evaluation.id)}
                    disabled={generatePdf.isPending}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {evaluation.pdf_url ? "Regénérer le PDF" : "Générer le PDF"}
                  </Button>
                )}
              {evaluation.pdf_url && (
                <CertificatePdfButton
                  pathOrUrl={evaluation.pdf_url}
                  bucket={EVALUATION_PDF_BUCKET}
                  label="Ouvrir le PDF"
                />
              )}
              {!isAssistMode && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`${basePath}/evaluation/${booking.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </>
          }
          tabs={
            <SegmentedControl<"preview">
              value={activeTab}
              onChange={setActiveTab}
              ariaLabel="Vue de l'évaluation"
              options={[{ value: "preview", label: "Aperçu PDF", icon: FileText }]}
            />
          }
        />

        {activeTab === "preview" && (
          <EvaluationPDFPreview evaluation={evaluation} booking={booking} />
        )}
      </PageShell>
    </FormateurPageShell>
  );
}

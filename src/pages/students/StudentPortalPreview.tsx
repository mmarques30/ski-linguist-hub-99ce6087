import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Eye,
  Calendar,
  FileText,
  ClipboardList,
  GraduationCap,
  User,
} from "lucide-react";
import {
  useStudentInscriptions,
  useStudentSessions,
  useStudentTests,
  useStudentDocuments,
  useStudentCertificates,
  useStudentSurveys,
} from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { buildSurveyUrl } from "@/lib/client-links";
import { CopyLinkRow } from "@/components/shared/CopyLinkRow";
import { getStatusLabel } from "@/lib/inscription-status";
import { DOCUMENT_TYPE_LABELS } from "@/lib/registration-welcome-documents";
import {
  pisteLabelFromPlacementAnswers,
  studentFacingPisteFromCecrl,
} from "@/lib/placement-test-engine";
import {
  CardGrid,
  PageHeader,
  PageShell,
  SegmentedControl,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";

type PreviewTab = "dashboard" | "planning" | "documents" | "evaluation";

export default function StudentPortalPreview() {
  const { id: studentId } = useParams<{ id: string }>();
  const origin = window.location.origin;
  const [tab, setTab] = useState<PreviewTab>("dashboard");

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-preview", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("ID manquant");
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, auth_user_id")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Stagiaire introuvable");
      return data;
    },
    enabled: !!studentId,
  });

  const { data: inscriptions } = useStudentInscriptions(studentId);
  const { data: sessions } = useStudentSessions(studentId);
  const { data: tests } = useStudentTests(studentId);
  const { data: documents } = useStudentDocuments(studentId);
  const { data: certificates } = useStudentCertificates(studentId);
  const { data: surveys } = useStudentSurveys(studentId);

  const backLink = (
    <Button variant="ghost" size="sm" className="-ml-2" asChild>
      <Link to={`/students/${studentId}`}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la fiche
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <PageHeader
            back={backLink}
            title="Prévisualisation espace stagiaire"
            icon={Eye}
            tone="gold"
          />
          <SurfaceCard flush>
            <TableSkeleton rows={5} cols={3} />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <PageShell>
          <SurfaceCard flush>
            <TableEmpty icon={User} title="Stagiaire introuvable" />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  const studentName = `${student.first_name} ${student.last_name}`;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          back={backLink}
          title="Prévisualisation espace stagiaire"
          description={studentName}
          icon={Eye}
          tone="gold"
          tabs={
            <SegmentedControl<PreviewTab>
              value={tab}
              onChange={setTab}
              ariaLabel="Prévisualisation espace stagiaire"
              options={[
                { value: "dashboard", label: "Tableau de bord" },
                { value: "planning", label: "Planning", icon: Calendar },
                { value: "documents", label: "Documents", icon: FileText },
                { value: "evaluation", label: "Évaluation", icon: GraduationCap },
              ]}
            />
          }
        />

        <Alert className="border-[hsl(var(--tint-gold-ring))] bg-[hsl(var(--tint-gold-bg))] text-[hsl(var(--tint-gold-fg))]">
          <Eye className="h-4 w-4" />
          <AlertTitle>Mode prévisualisation admin</AlertTitle>
          <AlertDescription>
            Vous voyez l&apos;espace tel que le stagiaire le verra. Aucune action n&apos;est enregistrée
            depuis cette vue.
            {!student.auth_user_id && (
              <> Ce stagiaire n&apos;a pas encore de compte portail lié.</>
            )}
          </AlertDescription>
        </Alert>

        {tab === "dashboard" && (
          <CardGrid cols={2}>
            <SurfaceCard title="Inscriptions" flush={!inscriptions?.length}>
              {!inscriptions?.length ? (
                <TableEmpty icon={ClipboardList} title="Aucune inscription" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {inscriptions.slice(0, 5).map((ins) => (
                    <li key={ins.id} className="flex items-center justify-between gap-2">
                      <Link
                        to={`/inscriptions/${ins.id}`}
                        className="min-w-0 truncate hover:underline"
                      >
                        {ins.language} · {ins.code}
                      </Link>
                      <StatusPill tone={toneForStatus(ins.status)} size="sm">
                        {getStatusLabel(ins.status, "fr")}
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard icon={ClipboardList} title="Tests de niveau" flush={!tests?.length}>
              {!tests?.length ? (
                <TableEmpty icon={ClipboardList} title="Aucun test" />
              ) : (
                <ul className="space-y-2 text-sm">
                  {tests.slice(0, 3).map((test) => {
                    const piste =
                      pisteLabelFromPlacementAnswers(test.answers) ||
                      studentFacingPisteFromCecrl(test.determined_level);
                    return (
                      <li key={test.id} className="flex items-center gap-2">
                        <StatusPill tone="info" size="sm">
                          {piste}
                        </StatusPill>
                        <span className="text-muted-foreground tabular">
                          {format(new Date(test.created_at), "dd/MM/yyyy")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SurfaceCard>
          </CardGrid>
        )}

        {tab === "planning" && (
          <SurfaceCard icon={Calendar} title="Sessions" flush={!sessions?.length}>
            {!sessions?.length ? (
              <TableEmpty icon={Calendar} title="Aucune session planifiée" />
            ) : (
              <ul className="space-y-3 text-sm">
                {sessions.map((session: { id: string; title?: string; start_datetime: string }) => (
                  <li
                    key={session.id}
                    className="rounded-[var(--radius)] border border-border p-3"
                  >
                    <p className="font-medium">{session.title || "Session"}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(session.start_datetime), "EEEE d MMMM yyyy à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        )}

        {tab === "documents" && (
          <SurfaceCard
            icon={FileText}
            title="Documents"
            flush={!documents?.length && !certificates?.length}
          >
            {!documents?.length && !certificates?.length ? (
              <TableEmpty icon={FileText} title="Aucun document" />
            ) : (
              <div className="space-y-3">
                {documents
                  ?.filter((doc) => doc.document_type?.toUpperCase() !== "CERTIFICAT")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-[var(--radius)] border border-border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </p>
                      <p className="text-muted-foreground tabular">
                        Envoyé le {format(new Date(doc.sent_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                  ))}
                {certificates?.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-[var(--radius)] border border-border p-3 text-sm"
                  >
                    <p className="font-medium">Certificat de fin de formation</p>
                    <p className="text-muted-foreground tabular">
                      Délivré le {format(new Date(cert.issue_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        )}

        {tab === "evaluation" && (
          <SurfaceCard
            icon={GraduationCap}
            title="Enquêtes de satisfaction"
            flush={!surveys?.length}
          >
            {!surveys?.length ? (
              <TableEmpty icon={GraduationCap} title="Aucune enquête" />
            ) : (
              <div className="space-y-3">
                {surveys.map((survey) => (
                  <CopyLinkRow
                    key={survey.id}
                    label={survey.completed_at ? "Enquête complétée" : "Enquête en attente"}
                    url={buildSurveyUrl(origin, survey.token)}
                    badge={survey.completed_at ? "Complétée" : "En attente"}
                  />
                ))}
              </div>
            )}
          </SurfaceCard>
        )}
      </PageShell>
    </MainLayout>
  );
}

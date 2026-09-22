import { StudentLayout } from "@/components/layout/StudentLayout";
import { BookOpen, Calendar, Award, MapPin, User, Clock, GraduationCap } from "lucide-react";
import {
  useStudentProfile,
  useStudentInscriptions,
  useStudentSessions,
  useStudentTests,
  useStudentCertificates,
} from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  pisteLabelFromPlacementAnswers,
  studentFacingPisteFromCecrl,
} from "@/lib/placement-test-engine";

import { getStatusLabel } from "@/lib/inscription-status";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import {
  CardGrid,
  DefinitionList,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  toneForStatus,
} from "@/components/ui-kit";

export default function StudentDashboard() {
  const { data: student } = useStudentProfile();
  const { data: inscriptions } = useStudentInscriptions(student?.id);
  const { data: sessions } = useStudentSessions(student?.id);
  const { data: tests } = useStudentTests(student?.id);
  const { data: certificates } = useStudentCertificates(student?.id);

  const activeInscription = inscriptions?.find(
    (i) => i.status === "en_cours" || i.status === "confirmee"
  );

  const upcomingSessions = (sessions || [])
    .filter((s: any) => new Date(s.start_datetime) > new Date())
    .slice(0, 3);

  const latestTest = tests?.[0];
  const pisteFromTest = pisteLabelFromPlacementAnswers(latestTest?.answers);
  const niveauAffiche =
    pisteFromTest ||
    studentFacingPisteFromCecrl(latestTest?.determined_level) ||
    studentFacingPisteFromCecrl(activeInscription?.entry_level);

  return (
    <StudentLayout>
      <PageShell>
        <PageHeader
          title={`Bonjour${student?.first_name ? `, ${student.first_name}` : ""} 👋`}
          description="Bienvenue dans votre espace de formation"
          icon={GraduationCap}
          tone="gold"
        />

        <CardGrid cols={2}>
          {/* Ma formation */}
          <SurfaceCard icon={BookOpen} title="Ma formation">
            {activeInscription ? (
              <div className="space-y-4">
                <DefinitionList
                  columns={2}
                  items={[
                    {
                      label: "Langue",
                      value: (
                        <StatusPill tone="neutral" size="sm">
                          {activeInscription.language}
                        </StatusPill>
                      ),
                    },
                    {
                      label: "Dates",
                      value: (
                        <span className="tabular">
                          {inscriptionDateRangeLabel(activeInscription)}
                        </span>
                      ),
                    },
                    {
                      label: "Piste / groupe",
                      value: (
                        <StatusPill tone="info" size="sm">
                          {niveauAffiche}
                        </StatusPill>
                      ),
                    },
                    ...(activeInscription.instructor_name
                      ? [
                          {
                            label: "Formateur",
                            value: (
                              <span className="inline-flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {activeInscription.instructor_name}
                              </span>
                            ),
                          },
                        ]
                      : []),
                    ...(activeInscription.course_location
                      ? [
                          {
                            label: "Lieu",
                            value: (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {activeInscription.course_location}
                              </span>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
                <StatusPill tone={toneForStatus(activeInscription.status)}>
                  {getStatusLabel(activeInscription.status, "fr")}
                </StatusPill>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune formation active pour le moment.
              </p>
            )}
          </SurfaceCard>

          {/* Mon planning */}
          <SurfaceCard icon={Calendar} title="Prochaines sessions">
            {upcomingSessions.length > 0 ? (
              <ul className="space-y-2.5">
                {upcomingSessions.map((s: any) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {format(new Date(s.start_datetime), "EEEE d MMMM — HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                    {s.location && (
                      <StatusPill tone="neutral" size="sm" className="shrink-0">
                        {s.location}
                      </StatusPill>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune session prévue.</p>
            )}
          </SurfaceCard>

          {/* Mes résultats */}
          <SurfaceCard icon={Award} title="Mes résultats">
            <div className="space-y-3 text-sm">
              {latestTest ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Test de niveau</span>
                    <StatusPill
                      tone={latestTest.status === "completed" ? "success" : "neutral"}
                      size="sm"
                    >
                      {latestTest.status === "completed" ? "Complété" : "En cours"}
                    </StatusPill>
                  </div>
                  {niveauAffiche && niveauAffiche !== "À déterminer" && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Votre piste</span>
                      <StatusPill tone="info" size="sm">
                        {niveauAffiche}
                      </StatusPill>
                    </div>
                  )}
                  {latestTest.score_percentage != null && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium tabular">
                        {latestTest.score_percentage}%
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Aucun test passé.</p>
              )}

              {certificates && certificates.length > 0 && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="mb-1 font-medium">Certificats</p>
                  {certificates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Certificat de fin de formation
                      </span>
                      <span className="text-xs tabular">
                        {format(new Date(c.issue_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SurfaceCard>

          {/* Historique inscriptions */}
          <SurfaceCard title="Historique des formations">
            {inscriptions && inscriptions.length > 0 ? (
              <ul className="space-y-2">
                {inscriptions.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium">{i.language}</span>
                      {i.code && (
                        <span className="ml-2 text-xs text-muted-foreground">{i.code}</span>
                      )}
                    </div>
                    <StatusPill tone={toneForStatus(i.status)} size="sm">
                      {getStatusLabel(i.status, "fr")}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune formation.</p>
            )}
          </SurfaceCard>
        </CardGrid>
      </PageShell>
    </StudentLayout>
  );
}

import { StudentLayout } from "@/components/layout/StudentLayout";
import { Button } from "@/components/ui/button";
import { GraduationCap, ExternalLink } from "lucide-react";
import { useStudentProfile, useStudentSurveys } from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

export default function StudentEvaluation() {
  const { data: student } = useStudentProfile();
  const { data: surveys, isLoading } = useStudentSurveys(student?.id);

  const pending = surveys?.filter((s) => !s.completed_at) || [];
  const completed = surveys?.filter((s) => s.completed_at) || [];

  return (
    <StudentLayout>
      <PageShell>
        <PageHeader
          title="Évaluation & Satisfaction"
          description="Évaluez votre formation et partagez vos retours"
          icon={GraduationCap}
          tone="teal"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={3} cols={3} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {/* Pending surveys */}
            {pending.length > 0 && (
              <SurfaceCard
                icon={GraduationCap}
                title="Enquêtes à compléter"
                accent="chart-4"
                className="bg-[hsl(var(--tint-gold-bg))]"
              >
                <ul className="space-y-3">
                  {pending.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Enquête de satisfaction</p>
                        <p className="text-xs text-muted-foreground tabular">
                          Créée le {format(new Date(s.created_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Button size="sm" className="shrink-0 self-start sm:self-auto" asChild>
                        <a href={`/survey/${s.token}`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Répondre
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            {/* Completed surveys */}
            {completed.length > 0 && (
              <SurfaceCard title="Enquêtes complétées">
                <ul className="space-y-2">
                  {completed.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">Enquête de satisfaction</p>
                        <p className="text-xs text-muted-foreground tabular">
                          Complétée le{" "}
                          {s.completed_at && format(new Date(s.completed_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <StatusPill tone="success" size="sm" className="shrink-0">
                        ✓ Soumise
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            {surveys?.length === 0 && (
              <SurfaceCard flush>
                <TableEmpty
                  icon={GraduationCap}
                  title="Aucune évaluation disponible"
                  description="Les évaluations seront disponibles en cours et en fin de formation."
                />
              </SurfaceCard>
            )}
          </div>
        )}
      </PageShell>
    </StudentLayout>
  );
}

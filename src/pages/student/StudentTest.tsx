import { StudentLayout } from "@/components/layout/StudentLayout";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import { useStudentProfile, useStudentTests } from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import {
  pisteLabelFromPlacementAnswers,
  studentFacingPisteFromCecrl,
} from "@/lib/placement-test-engine";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

/**
 * Résultats du test de niveau — le passage du test se fait à l'inscription
 * publique (/register), pas depuis le portail (Vague B : pas de CTA mort).
 */
export default function StudentTest() {
  const { data: student } = useStudentProfile();
  const { data: tests, isLoading } = useStudentTests(student?.id);

  const completedTests = tests?.filter((t) => t.status === "completed") || [];
  const pendingTests = tests?.filter((t) => t.status !== "completed") || [];

  const pisteFor = (t: (typeof completedTests)[number]) =>
    pisteLabelFromPlacementAnswers(t.answers) ||
    studentFacingPisteFromCecrl(t.determined_level);

  return (
    <StudentLayout>
      <PageShell>
        <PageHeader
          title="Test de niveau"
          description="Consultez ici le résultat de votre test. Le passage se fait lors de l'inscription en ligne."
          icon={ClipboardList}
          tone="blue"
        />

        {isLoading ? (
          <SurfaceCard flush>
            <TableSkeleton rows={3} cols={3} />
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            {pendingTests.length > 0 && (
              <SurfaceCard icon={Clock} title="Test en cours">
                <ul className="space-y-3">
                  {pendingTests.map((t) => (
                    <li
                      key={t.id}
                      className="flex flex-col gap-2 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{t.language}</p>
                        <p className="text-xs text-muted-foreground">
                          Commencé le {format(new Date(t.created_at), "dd/MM/yyyy")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reprenez le test via le lien d&apos;inscription reçu par e-mail, ou
                          contactez FLI.
                        </p>
                      </div>
                      <StatusPill tone="warning" size="sm" className="shrink-0 self-start">
                        En cours
                      </StatusPill>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            {completedTests.length > 0 && (
              <SurfaceCard icon={CheckCircle} title="Tests complétés">
                <ul className="space-y-3">
                  {completedTests.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{t.language}</p>
                        <p className="text-xs text-muted-foreground tabular">
                          {t.completed_at && format(new Date(t.completed_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusPill tone="success" size="sm" className="mb-1">
                          {pisteFor(t)}
                        </StatusPill>
                        {t.score_percentage != null && (
                          <p className="text-xs text-muted-foreground tabular">
                            Score : {t.score_percentage}%
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            )}

            {tests?.length === 0 && (
              <SurfaceCard flush>
                <TableEmpty
                  icon={ClipboardList}
                  title="Aucun résultat pour l'instant"
                  description="Le test de niveau se passe lors de l'inscription publique. Une fois complété, votre piste apparaîtra ici. Contactez FLI si vous devez le (re)passer."
                />
              </SurfaceCard>
            )}
          </div>
        )}
      </PageShell>
    </StudentLayout>
  );
}

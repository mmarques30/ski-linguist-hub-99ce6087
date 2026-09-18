import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import { useStudentProfile, useStudentTests } from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import {
  pisteLabelFromPlacementAnswers,
  studentFacingPisteFromCecrl,
} from "@/lib/placement-test-engine";

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Test de niveau</h1>
          <p className="text-muted-foreground text-sm">
            Consultez ici le résultat de votre test. Le passage se fait lors de
            l&apos;inscription en ligne.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Test en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingTests.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{t.language}</p>
                        <p className="text-xs text-muted-foreground">
                          Commencé le {format(new Date(t.created_at), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reprenez le test via le lien d&apos;inscription reçu
                          par e-mail, ou contactez FLI.
                        </p>
                      </div>
                      <Badge variant="outline">En cours</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {completedTests.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Tests complétés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTests.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{t.language}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.completed_at &&
                            format(new Date(t.completed_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="mb-1">{pisteFor(t)}</Badge>
                        {t.score_percentage != null && (
                          <p className="text-xs text-muted-foreground">
                            Score : {t.score_percentage}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {tests?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Aucun résultat pour l&apos;instant</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Le test de niveau se passe lors de l&apos;inscription
                    publique. Une fois complété, votre piste apparaîtra ici.
                    Contactez FLI si vous devez le (re)passer.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

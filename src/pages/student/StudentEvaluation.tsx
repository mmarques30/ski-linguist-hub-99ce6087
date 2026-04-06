import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ExternalLink } from "lucide-react";
import { useStudentProfile, useStudentSurveys } from "@/hooks/useStudentPortal";
import { format } from "date-fns";

export default function StudentEvaluation() {
  const { data: student } = useStudentProfile();
  const { data: surveys, isLoading } = useStudentSurveys(student?.id);

  const pending = surveys?.filter((s) => !s.completed_at) || [];
  const completed = surveys?.filter((s) => s.completed_at) || [];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Évaluation & Satisfaction</h1>
          <p className="text-muted-foreground text-sm">
            Évaluez votre formation et partagez vos retours
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending surveys */}
            {pending.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                    Enquêtes à compléter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pending.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Enquête de satisfaction
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Créée le{" "}
                          {format(new Date(s.created_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <a href={`/survey/${s.token}`}>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Répondre
                        </a>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed surveys */}
            {completed.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Enquêtes complétées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completed.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                    >
                      <div>
                        <p className="font-medium">Enquête de satisfaction</p>
                        <p className="text-xs text-muted-foreground">
                          Complétée le{" "}
                          {s.completed_at &&
                            format(new Date(s.completed_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-emerald-700">
                        ✓ Soumise
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {surveys?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">
                    Aucune évaluation disponible
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Les évaluations seront disponibles en cours et en fin de
                    formation.
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

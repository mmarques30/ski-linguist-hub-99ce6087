import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Award, MapPin, User, Clock } from "lucide-react";
import {
  useStudentProfile,
  useStudentInscriptions,
  useStudentSessions,
  useStudentTests,
  useStudentCertificates,
} from "@/hooks/useStudentPortal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon",
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_cours: "En cours",
  terminee: "Terminée",
  facturee: "Facturée",
};

const statusColors: Record<string, string> = {
  en_cours: "bg-blue-100 text-blue-800",
  confirmee: "bg-emerald-100 text-emerald-800",
  terminee: "bg-muted text-muted-foreground",
  en_attente: "bg-amber-100 text-amber-800",
};

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

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            Bonjour{student?.first_name ? `, ${student.first_name}` : ""} 👋
          </h1>
          <p className="text-muted-foreground">
            Bienvenue dans votre espace de formation
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Ma formation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Ma formation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeInscription ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Langue</span>
                    <Badge variant="outline">{activeInscription.language}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span>
                      {format(new Date(activeInscription.start_date), "dd/MM/yyyy")} —{" "}
                      {format(new Date(activeInscription.end_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Niveau</span>
                    <Badge>{activeInscription.entry_level || "À déterminer"}</Badge>
                  </div>
                  {activeInscription.instructor_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Formateur</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {activeInscription.instructor_name}
                      </span>
                    </div>
                  )}
                  {activeInscription.course_location && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Lieu</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activeInscription.course_location}
                      </span>
                    </div>
                  )}
                  <Badge className={statusColors[activeInscription.status] || ""}>
                    {statusLabels[activeInscription.status] || activeInscription.status}
                  </Badge>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucune formation active pour le moment.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mon planning */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Prochaines sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2.5">
                  {upcomingSessions.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm"
                    >
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(s.start_datetime), "EEEE d MMMM — HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      {s.location && (
                        <Badge variant="outline" className="text-[10px]">
                          {s.location}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucune session prévue.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mes résultats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Mes résultats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {latestTest ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Test de niveau</span>
                      <Badge variant={latestTest.status === "completed" ? "default" : "outline"}>
                        {latestTest.status === "completed" ? "Complété" : "En cours"}
                      </Badge>
                    </div>
                    {latestTest.determined_level && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Niveau déterminé</span>
                        <Badge>{latestTest.determined_level}</Badge>
                      </div>
                    )}
                    {latestTest.score_percentage != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium">{latestTest.score_percentage}%</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Aucun test passé.</p>
                )}

                {certificates && certificates.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <p className="font-medium mb-1">Certificats</p>
                    {certificates.map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Niveau {c.level_achieved}
                        </span>
                        <span className="text-xs">
                          {format(new Date(c.issue_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historique inscriptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historique des formations</CardTitle>
            </CardHeader>
            <CardContent>
              {inscriptions && inscriptions.length > 0 ? (
                <div className="space-y-2">
                  {inscriptions.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
                    >
                      <div>
                        <span className="font-medium">{i.language}</span>
                        {i.code && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {i.code}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={statusColors[i.status] || ""}
                      >
                        {statusLabels[i.status] || i.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune formation.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}

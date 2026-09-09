import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Eye,
  Calendar,
  FileText,
  ClipboardList,
  GraduationCap,
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

export default function StudentPortalPreview() {
  const { id: studentId } = useParams<{ id: string }>();
  const origin = window.location.origin;

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout>
        <p className="text-center py-24 text-muted-foreground">Stagiaire introuvable</p>
      </MainLayout>
    );
  }

  const studentName = `${student.first_name} ${student.last_name}`;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/students/${studentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Prévisualisation espace stagiaire
            </h1>
            <p className="text-muted-foreground">{studentName}</p>
          </div>
        </div>

        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
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

        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Inscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  {!inscriptions?.length ? (
                    <p className="text-sm text-muted-foreground">Aucune inscription</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {inscriptions.slice(0, 5).map((ins) => (
                        <li key={ins.id} className="flex justify-between gap-2">
                          <span>{ins.language} · {ins.code}</span>
                          <Badge variant="outline">{ins.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Tests de niveau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!tests?.length ? (
                    <p className="text-sm text-muted-foreground">Aucun test</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {tests.slice(0, 3).map((test) => (
                        <li key={test.id}>
                          Niveau {test.determined_level || "—"} ·{" "}
                          {format(new Date(test.created_at), "dd/MM/yyyy")}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!sessions?.length ? (
                  <p className="text-sm text-muted-foreground">Aucune session planifiée</p>
                ) : (
                  <ul className="space-y-3 text-sm">
                    {sessions.map((session: { id: string; title?: string; start_datetime: string }) => (
                      <li key={session.id} className="rounded-lg border p-3">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!documents?.length && !certificates?.length ? (
                  <p className="text-sm text-muted-foreground">Aucun document</p>
                ) : (
                  <>
                    {documents?.map((doc) => (
                      <div key={doc.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{doc.document_type}</p>
                        <p className="text-muted-foreground">
                          Envoyé le {format(new Date(doc.sent_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                    ))}
                    {certificates?.map((cert) => (
                      <div key={cert.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">Certificat</p>
                        <p className="text-muted-foreground">Niveau {cert.level_achieved}</p>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Enquêtes de satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!surveys?.length ? (
                  <p className="text-sm text-muted-foreground">Aucune enquête</p>
                ) : (
                  surveys.map((survey) => (
                    <CopyLinkRow
                      key={survey.id}
                      label={survey.completed_at ? "Enquête complétée" : "Enquête en attente"}
                      url={buildSurveyUrl(origin, survey.token)}
                      badge={survey.completed_at ? "Complétée" : "En attente"}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

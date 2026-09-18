import { Link } from "react-router-dom";
import { Eye, Loader2, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/useStudents";
import { studentAssistPath } from "@/lib/client-links";

/** Entrée Portails — choisir un stagiaire pour le mode Assister (Vague C). */
export default function PortalStudentPicker() {
  const { data: students, isLoading } = useStudents();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Espace stagiaire</h1>
          <p className="text-muted-foreground text-sm">
            Ouvrez le portail d&apos;un stagiaire en mode Assister (lecture seule).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Choisir un stagiaire
            </CardTitle>
            <CardDescription>
              Même écrans que le portail réel, avec bandeau ambre staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !students?.length ? (
              <p className="text-sm text-muted-foreground">Aucun stagiaire.</p>
            ) : (
              <ul className="space-y-2">
                {students.slice(0, 50).map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={studentAssistPath(s.id, "dashboard")}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Assister
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Liste complète :{" "}
              <Link to="/students" className="text-primary hover:underline">
                Stagiaires
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

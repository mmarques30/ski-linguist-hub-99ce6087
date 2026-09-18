import { Link } from "react-router-dom";
import { Eye, Loader2, UserCog } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstructors } from "@/hooks/useInstructors";
import { formateurAssistPath } from "@/lib/client-links";

/** Entrée Portails — choisir un formateur pour le mode Assister (Vague C). */
export default function PortalFormateurPicker() {
  const { data: instructors, isLoading } = useInstructors();

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Espace formateur</h1>
          <p className="text-muted-foreground text-sm">
            Ouvrez l&apos;espace d&apos;un formateur en mode Assister.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Choisir un formateur
            </CardTitle>
            <CardDescription>
              Évaluations filtrées sous bandeau ambre staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !instructors?.length ? (
              <p className="text-sm text-muted-foreground">Aucun formateur.</p>
            ) : (
              <ul className="space-y-2">
                {instructors.slice(0, 50).map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {i.first_name} {i.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{i.email}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={formateurAssistPath(i.id, "evaluations")}>
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
              <Link to="/formateurs" className="text-primary hover:underline">
                Formateurs
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

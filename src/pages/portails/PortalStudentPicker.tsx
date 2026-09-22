import { Link } from "react-router-dom";
import { Eye, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/useStudents";
import { studentAssistPath } from "@/lib/client-links";
import {
  CardList,
  CardListItem,
  PageHeader,
  PageShell,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

/** Entrée Portails — choisir un stagiaire pour le mode Assister (Vague C). */
export default function PortalStudentPicker() {
  const { data: students, isLoading } = useStudents();

  return (
    <MainLayout>
      <PageShell width="narrow">
        <PageHeader
          title="Espace stagiaire"
          description="Ouvrez le portail d'un stagiaire en mode Assister (lecture seule)."
          icon={Eye}
          tone="gold"
        />

        <SurfaceCard
          icon={Users}
          title="Choisir un stagiaire"
          description="Même écrans que le portail réel, avec bandeau ambre staff."
          flush
          footer={
            <p className="text-xs text-muted-foreground">
              Liste complète :{" "}
              <Link
                to="/students"
                className="font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
              >
                Stagiaires
              </Link>
            </p>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : !students?.length ? (
            <TableEmpty icon={Users} title="Aucun stagiaire." />
          ) : (
            <CardList>
              {students.slice(0, 50).map((s) => (
                <CardListItem
                  key={s.id}
                  title={
                    <Link to={`/students/${s.id}`} className="hover:underline">
                      {s.first_name} {s.last_name}
                    </Link>
                  }
                  subtitle={s.email}
                  meta={
                    <Button size="sm" variant="outline" asChild>
                      <Link to={studentAssistPath(s.id, "dashboard")}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Assister
                      </Link>
                    </Button>
                  }
                />
              ))}
            </CardList>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

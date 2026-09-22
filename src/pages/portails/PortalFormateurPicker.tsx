import { Link } from "react-router-dom";
import { Eye, UserCog } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useInstructors } from "@/hooks/useInstructors";
import { formateurAssistPath } from "@/lib/client-links";
import {
  CardList,
  CardListItem,
  PageHeader,
  PageShell,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";

/** Entrée Portails — choisir un formateur pour le mode Assister (Vague C). */
export default function PortalFormateurPicker() {
  const { data: instructors, isLoading } = useInstructors();

  return (
    <MainLayout>
      <PageShell width="narrow">
        <PageHeader
          title="Espace formateur"
          description="Ouvrez l'espace d'un formateur en mode Assister."
          icon={Eye}
          tone="gold"
        />

        <SurfaceCard
          icon={UserCog}
          title="Choisir un formateur"
          description="Évaluations filtrées sous bandeau ambre staff."
          flush
          footer={
            <p className="text-xs text-muted-foreground">
              Liste complète :{" "}
              <Link
                to="/formateurs"
                className="font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
              >
                Formateurs
              </Link>
            </p>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : !instructors?.length ? (
            <TableEmpty icon={UserCog} title="Aucun formateur." />
          ) : (
            <CardList>
              {instructors.slice(0, 50).map((i) => (
                <CardListItem
                  key={i.id}
                  title={
                    <Link to={`/formateurs/${i.id}`} className="hover:underline">
                      {i.first_name} {i.last_name}
                    </Link>
                  }
                  subtitle={i.email}
                  meta={
                    <Button size="sm" variant="outline" asChild>
                      <Link to={formateurAssistPath(i.id, "evaluations")}>
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

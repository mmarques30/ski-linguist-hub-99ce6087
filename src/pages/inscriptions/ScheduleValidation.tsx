import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sun, Sunset, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePendingSchedules } from "@/hooks/usePendingSchedules";
import { useBulkApproveSchedule } from "@/hooks/useApproveSchedule";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";

export default function ScheduleValidation() {
  const { data, isLoading, isError } = usePendingSchedules();
  const bulkApprove = useBulkApproveSchedule();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleInGroup = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleBulkApprove = async (slot: "matin" | "apres-midi") => {
    if (!selectedIds.size) {
      toast.error("Sélectionnez au moins une inscription");
      return;
    }

    try {
      await bulkApprove.mutateAsync({
        inscriptionIds: Array.from(selectedIds),
        scheduleStatus: slot,
      });
      toast.success(
        `${selectedIds.size} inscription(s) — groupe ${slot === "matin" ? "matin" : "après-midi"} validé`
      );
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Validation horaires J-{SCHEDULE_ASSIGNMENT_DAYS_BEFORE}
          </h1>
          <p className="text-muted-foreground mt-1">
            Inscriptions en attente de groupe matin / après-midi (début dans les{" "}
            {SCHEDULE_ASSIGNMENT_DAYS_BEFORE} prochains jours)
          </p>
        </div>

        <Alert>
          <AlertTitle>Analysez par langue avant de valider</AlertTitle>
          <AlertDescription>
            Sélectionnez plusieurs inscriptions d&apos;un même groupe, puis validez matin ou
            après-midi en lot. Vous pouvez aussi ouvrir chaque fiche pour un cas particulier.
          </AlertDescription>
        </Alert>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="text-destructive">Impossible de charger les horaires en attente.</p>
        )}

        {!isLoading && data?.total === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucune inscription en attente de validation dans la fenêtre J-
              {SCHEDULE_ASSIGNMENT_DAYS_BEFORE}.
            </CardContent>
          </Card>
        )}

        {data?.groups.map((group) => {
          const groupIds = group.inscriptions.map((i) => i.id);
          const allInGroupSelected = groupIds.every((id) => selectedIds.has(id));

          return (
            <Card key={`${group.startDate}-${group.language}`}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{group.language}</CardTitle>
                    <CardDescription>
                      Début le{" "}
                      {format(new Date(group.startDate), "EEEE d MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {group.inscriptions.length} en attente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allInGroupSelected}
                    onCheckedChange={(checked) =>
                      toggleInGroup(groupIds, checked === true)
                    }
                    id={`group-${group.startDate}-${group.language}`}
                  />
                  <label
                    htmlFor={`group-${group.startDate}-${group.language}`}
                    className="text-sm cursor-pointer"
                  >
                    Sélectionner tout le groupe
                  </label>
                </div>

                <div className="rounded-lg border divide-y">
                  {group.inscriptions.map((inscription) => (
                    <div
                      key={inscription.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                    >
                      <Checkbox
                        checked={selectedIds.has(inscription.id)}
                        onCheckedChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(inscription.id)) next.delete(inscription.id);
                            else next.add(inscription.id);
                            return next;
                          });
                        }}
                      />
                      <div className="flex-1 min-w-[200px]">
                        <p className="font-medium">{inscription.student_name}</p>
                        <p className="text-muted-foreground text-xs">
                          {inscription.code || "—"} · Niveau {inscription.entry_level || "—"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/inscriptions/${inscription.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {data && data.total > 0 && (
          <div className="sticky bottom-4 flex flex-wrap gap-2 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur">
            <Badge variant="secondary">{selectedIds.size} sélectionnée(s)</Badge>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedIds.size || bulkApprove.isPending}
              onClick={() => handleBulkApprove("matin")}
            >
              {bulkApprove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sun className="mr-2 h-4 w-4" />
              )}
              Valider matin
            </Button>
            <Button
              type="button"
              disabled={!selectedIds.size || bulkApprove.isPending}
              onClick={() => handleBulkApprove("apres-midi")}
            >
              {bulkApprove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sunset className="mr-2 h-4 w-4" />
              )}
              Valider après-midi
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

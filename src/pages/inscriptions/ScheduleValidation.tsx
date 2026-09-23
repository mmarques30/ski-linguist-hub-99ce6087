import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sun, Sunset, ExternalLink, Clock, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { usePendingSchedules } from "@/hooks/usePendingSchedules";
import { useBulkApproveSchedule } from "@/hooks/useApproveSchedule";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";
import { getStatusLabel } from "@/lib/inscription-status";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import { scheduleButtonLabel, scheduleLabelForSlot } from "@/lib/fli-schedule-slots";
import {
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";

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
        `${selectedIds.size} inscription(s) — ${scheduleLabelForSlot(slot)}`
      );
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation");
    }
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Constitution des groupes"
          icon={Clock}
          tone="blue"
          description={
            <>
              Stages collectifs en station : attribution du groupe matin (8h30–12h30)
              ou après-midi (13h30–17h30) pour les débuts dans les{" "}
              {SCHEDULE_ASSIGNMENT_DAYS_BEFORE} prochains jours, et les retards non
              traités. Les formations individuelles ou en ligne n&apos;apparaissent pas
              ici.
            </>
          }
        />

        {/* Compteurs déjà présents dans la page, remontés en tuiles. */}
        <StatTileGrid cols={2}>
          <StatTile
            label="Inscriptions en attente de groupe"
            value={data?.total ?? 0}
            hint={`Fenêtre J-${SCHEDULE_ASSIGNMENT_DAYS_BEFORE} et retards`}
            icon={Users}
            tone="blue"
            loading={isLoading}
          />
          <StatTile
            label="Formations commencées sans horaire"
            value={data?.lateTotal ?? 0}
            hint="À traiter en priorité"
            icon={AlertTriangle}
            tone="rose"
            loading={isLoading}
          />
        </StatTileGrid>

        {data && data.lateTotal > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {data.lateTotal} formation{data.lateTotal > 1 ? "s" : ""} commencée
              {data.lateTotal > 1 ? "s" : ""} sans horaire validé
            </AlertTitle>
            <AlertDescription>
              Ces inscriptions restaient invisibles : la liste ne remontait que les débuts
              à venir. Elles sont regroupées en haut, du retard le plus ancien au plus
              récent.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertTitle>Analysez par langue avant de valider</AlertTitle>
          <AlertDescription>
            Sélectionnez plusieurs inscriptions d&apos;un même groupe, puis validez matin ou
            après-midi en lot. Vous pouvez aussi ouvrir chaque fiche pour un cas particulier.
          </AlertDescription>
        </Alert>

        {isLoading && (
          <SurfaceCard>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-16 w-full rounded-[var(--radius)]" />
              ))}
            </div>
          </SurfaceCard>
        )}

        {isError && (
          <p className="text-destructive">Impossible de charger les horaires en attente.</p>
        )}

        {!isLoading && data?.total === 0 && (
          <SurfaceCard flush>
            <TableEmpty
              icon={Clock}
              title={`Aucun stage collectif en station en attente de groupe, ni dans la fenêtre J-${SCHEDULE_ASSIGNMENT_DAYS_BEFORE}, ni en retard.`}
              description="Les formations individuelles ou en ligne sont exclues de cet écran."
            />
          </SurfaceCard>
        )}

        {data?.groups.map((group) => {
          const groupIds = group.inscriptions.map((i) => i.id);
          const allInGroupSelected = groupIds.every((id) => selectedIds.has(id));

          return (
            <SurfaceCard
              key={`${group.startDate}-${group.language}`}
              title={group.language}
              description={`Début le ${format(new Date(group.startDate), "EEEE d MMMM yyyy", {
                locale: fr,
              })}`}
              accent={group.deadline.late ? "chart-2" : "none"}
              actions={
                <>
                  <StatusPill tone={group.deadline.late ? "danger" : "neutral"}>
                    {group.deadline.label}
                  </StatusPill>
                  <StatusPill tone="info">
                    {group.inscriptions.length} en attente
                  </StatusPill>
                </>
              }
              bodyClassName="space-y-4"
            >
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

              <ul className="divide-y divide-border rounded-[var(--radius)] border border-border">
                {group.inscriptions.map((inscription) => (
                  <li
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
                      {inscription.student_id ? (
                        <Link
                          to={`/students/${inscription.student_id}`}
                          className="font-medium hover:underline"
                        >
                          {inscription.student_name}
                        </Link>
                      ) : (
                        <p className="font-medium">{inscription.student_name}</p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        {inscription.code || "—"} · Niveau {inscription.entry_level || "—"} ·{" "}
                        {getStatusLabel(inscription.status, "fr")}
                      </p>
                      {inscription.schedule && (
                        <p className="text-muted-foreground text-xs">
                          Horaire prévu : {inscription.schedule}
                        </p>
                      )}
                      {/* BL-029 : cette date n'est qu'un souhait, la caler en
                          matin / après-midi avant de la confirmer est prématuré. */}
                      {inscription.dates_to_confirm && (
                        <StatusPill tone="warning" size="sm" className="mt-1 font-normal">
                          Dates {DATES_A_PLANIFIER_LABEL.toLowerCase()}
                        </StatusPill>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={`/inscriptions/${inscription.id}`}
                        aria-label={`Ouvrir la fiche de ${inscription.student_name}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </SurfaceCard>
          );
        })}

        {data && data.total > 0 && (
          <div className="sticky bottom-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
            <StatusPill tone="neutral">{selectedIds.size} sélectionnée(s)</StatusPill>
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
              {scheduleButtonLabel("matin")}
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
              {scheduleButtonLabel("apres-midi")}
            </Button>
          </div>
        )}
      </PageShell>
    </MainLayout>
  );
}

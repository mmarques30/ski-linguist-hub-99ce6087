import { useMemo, useState } from "react";
import { Eye, FileClock, KeyRound, PencilLine } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import {
  LoadLegend,
  PeakHoursList,
  RolesStackBar,
  MonitoringKpiCard,
} from "@/components/monitoramento/MonitoringWidgets";
import {
  useMonitoringAccessFeed,
  useMonitoringDashboardAnalytics,
} from "@/hooks/useMonitoramento";
import { classifyActionTone, toneFromHealth } from "@/lib/monitoramento";
import {
  FilterBar,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
  TrendChart,
} from "@/components/ui-kit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AccessFilter = "all" | "create" | "update" | "delete" | "other";

export default function MonitoramentoAcessos() {
  const { data: logs = [], isLoading } = useMonitoringAccessFeed();
  const { data: analytics } = useMonitoringDashboardAnalytics();
  const [filter, setFilter] = useState<AccessFilter>("all");

  const stats = useMemo(() => {
    const create = logs.filter((l) => /create|insert|import/i.test(l.action)).length;
    const update = logs.filter((l) => /update|patch|edit/i.test(l.action)).length;
    const del = logs.filter((l) => /delete|purge/i.test(l.action)).length;
    const withUser = logs.filter((l) => l.user_id).length;
    return { create, update, del, withUser, total: logs.length };
  }, [logs]);

  const filtered = useMemo(() => {
    if (filter === "all") return logs;
    if (filter === "create") return logs.filter((l) => /create|insert|import/i.test(l.action));
    if (filter === "update") return logs.filter((l) => /update|patch|edit/i.test(l.action));
    if (filter === "delete") return logs.filter((l) => /delete|purge/i.test(l.action));
    return logs.filter(
      (l) => !/create|insert|import|update|patch|edit|delete|purge/i.test(l.action),
    );
  }, [logs, filter]);

  const loginSeries = useMemo(
    () => (analytics?.hours ?? []).map((h) => ({ hour: h.label, logins: h.count })),
    [analytics?.hours],
  );

  const usageSeries = useMemo(
    () => (analytics?.days ?? []).map((d) => ({ day: d.label, usage: d.count })),
    [analytics?.days],
  );

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Accès système"
          description="Visualisations, entrées libérées par l'équipe, logs d'exécution et modifications"
          icon={KeyRound}
          tone="navy"
          meta={
            <StatusPill tone="info">
              {stats.total} événement{stats.total > 1 ? "s" : ""} (7 j)
            </StatusPill>
          }
        />

        <MonitoramentoSubnav />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MonitoringKpiCard
            label="Acteurs actifs (24 h)"
            value={analytics?.activeActors24h ?? "—"}
            hint="user_id distincts dans audit_log"
            points={analytics?.activitySpark ?? [1, 2, 3]}
            sparkColor="hsl(var(--tint-teal-fg))"
            status={<Eye className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Créations"
            value={stats.create}
            hint="Entrées libérées / imports"
            points={[2, 3, 4, 3, 5]}
            sparkColor="hsl(var(--tint-teal-fg))"
            sparkVariant="bars"
            status={<FileClock className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Modifications"
            value={stats.update}
            hint="Updates journalisés"
            points={[3, 2, 4, 5, 4]}
            sparkColor="hsl(var(--tint-blue-fg))"
            status={<PencilLine className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Avec acteur"
            value={stats.withUser}
            hint="user_id renseigné"
            points={[4, 5, 4, 6, 5]}
            sparkColor="hsl(var(--tint-navy-fg))"
          />
        </div>

        <SurfaceCard
          title="Accès & charge"
          description="Pics horaires et volume — même grammaire que le dashboard SmartHR"
          actions={<LoadLegend />}
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="mb-3 text-sm font-medium">Heures de pointe (aujourd'hui)</p>
              <PeakHoursList hours={analytics?.hours ?? []} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium">Analyse d'activité</p>
                <TrendChart
                  data={loginSeries}
                  series={[{ key: "logins", label: "Actions" }]}
                  xKey="hour"
                  variant="area"
                  height={200}
                  emptyMessage="Aucune activité"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Répartition des rôles</p>
                <RolesStackBar roles={analytics?.roles ?? []} />
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Tendance d'usage (7 j)">
          <TrendChart
            data={usageSeries}
            series={[{ key: "usage", label: "Événements", color: "hsl(var(--tint-orange-fg))" }]}
            xKey="day"
            variant="line"
            height={200}
            emptyMessage="Pas d'historique"
          />
        </SurfaceCard>

        <SurfaceCard
          title="Journal d'exécution & modifications"
          description="Source : public.audit_log"
          toolbar={
            <FilterBar
              filters={
                <Select value={filter} onValueChange={(v) => setFilter(v as AccessFilter)}>
                  <SelectTrigger className="w-[200px]" aria-label="Filtrer les accès">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="create">Créations</SelectItem>
                    <SelectItem value="update">Modifications</SelectItem>
                    <SelectItem value="delete">Suppressions</SelectItem>
                    <SelectItem value="other">Autres exécutions</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          }
        >
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : filtered.length === 0 ? (
            <TableEmpty
              title="Aucun accès journalisé"
              description="Aucune entrée audit_log pour ce filtre"
            />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>Quand</TableHeadCell>
                  <TableHeadCell>Action</TableHeadCell>
                  <TableHeadCell>Table</TableHeadCell>
                  <TableHeadCell>Record</TableHeadCell>
                  <TableHeadCell>Acteur</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((row) => {
                  const tone = classifyActionTone(row.action);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        {format(new Date(row.created_at), "dd MMM HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{row.action}</code>
                      </TableCell>
                      <TableCell>{row.table_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.record_id ? `${row.record_id.slice(0, 8)}…` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.user_id ? `${row.user_id.slice(0, 8)}…` : "système"}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={toneFromHealth(tone)}>
                          {tone === "danger"
                            ? "Risque"
                            : tone === "warn"
                              ? "Modif. lourde"
                              : tone === "ok"
                                ? "Création"
                                : "Exécution"}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

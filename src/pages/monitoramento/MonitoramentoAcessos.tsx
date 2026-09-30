import { useMemo, useState } from "react";
import { Eye, FileClock, KeyRound, PencilLine } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import {
  KpiAnalysisTable,
  MonitoringKpiCard,
  type KpiAnalysisRow,
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
  SectionHeading,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
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
  const { data: analytics, isLoading: analyticsLoading } =
    useMonitoringDashboardAnalytics();
  const [filter, setFilter] = useState<AccessFilter>("all");

  const stats = useMemo(() => {
    const create = logs.filter((l) => /create|insert|import/i.test(l.action)).length;
    const update = logs.filter((l) => /update|patch|edit/i.test(l.action)).length;
    const del = logs.filter((l) => /delete|purge/i.test(l.action)).length;
    const withUser = logs.filter((l) => l.user_id).length;
    const system = logs.filter((l) => !l.user_id).length;
    return { create, update, del, withUser, system, total: logs.length };
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

  const peakHour = useMemo(() => {
    const hours = analytics?.hours ?? [];
    if (!hours.length) return null;
    return hours.reduce((best, h) => (h.count > best.count ? h : best), hours[0]);
  }, [analytics?.hours]);

  const topTables = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of logs) {
      counts.set(row.table_name, (counts.get(row.table_name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([table, count]) => ({ table, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [logs]);

  const analysisRows: KpiAnalysisRow[] = useMemo(
    () => [
      {
        indicator: "Acteurs actifs (24 h)",
        value: analytics?.activeActors24h ?? "—",
        analysis:
          (analytics?.activeActors24h ?? 0) === 0
            ? "Aucun user_id distinct aujourd'hui — activité système seule ou session absente."
            : `${analytics?.activeActors24h} utilisateur(s) ont généré des écritures journalisées.`,
        tone: (analytics?.activeActors24h ?? 0) > 0 ? "ok" : "neutral",
        statusLabel: (analytics?.activeActors24h ?? 0) > 0 ? "Actif" : "Calme",
      },
      {
        indicator: "Entrées créées / importées",
        value: stats.create,
        analysis:
          stats.create === 0
            ? "Pas de création sur 7 j."
            : `${stats.create} création(s) — entrées libérées par l'équipe ou imports.`,
        tone: stats.create > 0 ? "ok" : "neutral",
        statusLabel: stats.create > 0 ? "Flux OK" : "Aucun",
      },
      {
        indicator: "Modifications",
        value: stats.update,
        analysis:
          stats.update === 0
            ? "Pas d'update journalisé."
            : `${stats.update} modification(s) — contrôler les tables les plus touchées.`,
        tone: "info",
        statusLabel: "Mesuré",
      },
      {
        indicator: "Suppressions",
        value: stats.del,
        analysis:
          stats.del === 0
            ? "Aucune suppression."
            : "Volume de delete/purge à valider (cleanup vs incident).",
        tone: stats.del > 10 ? "warn" : "neutral",
        statusLabel: stats.del > 10 ? "Élevé" : "Normal",
      },
      {
        indicator: "Heure de pointe",
        value: peakHour ? `${peakHour.label} (${peakHour.count})` : "—",
        analysis: peakHour
          ? `Charge ${peakHour.band} à ${peakHour.label} — pic d'accès / exécutions.`
          : "Pas encore de répartition horaire.",
        tone: peakHour?.band === "peak" || peakHour?.band === "high" ? "warn" : "ok",
        statusLabel: peakHour?.band ?? "n/a",
      },
      {
        indicator: "Traçabilité acteur",
        value: `${stats.withUser} / ${stats.total}`,
        analysis: `${stats.system} événement(s) sans user_id (système / edge).`,
        tone: stats.total > 0 && stats.withUser / Math.max(stats.total, 1) < 0.3 ? "warn" : "ok",
        statusLabel:
          stats.total > 0 && stats.withUser / Math.max(stats.total, 1) < 0.3
            ? "Faible"
            : "Bonne",
      },
    ],
    [analytics?.activeActors24h, stats, peakHour],
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
            hint="user_id distincts"
            points={analytics?.activitySpark ?? [1, 2, 3]}
            sparkColor="hsl(var(--tint-teal-fg))"
            status={<Eye className="h-4 w-4 text-muted-foreground" />}
          />
          <MonitoringKpiCard
            label="Créations"
            value={stats.create}
            hint="Entrées / imports"
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
            label="Événements 7 j"
            value={stats.total}
            hint="audit_log"
            points={analytics?.days.map((d) => d.count) ?? [1, 2, 1]}
            sparkColor="hsl(var(--tint-navy-fg))"
          />
        </div>

        <KpiAnalysisTable
          title="Analyse résumé — Accès"
          description="Lecture des KPIs de visualisation, entrées libérées, exécutions et modifications"
          rows={analysisRows}
          loading={isLoading || analyticsLoading}
        />

        <SectionHeading
          title="Charge horaire (tableau)"
          description="Pics d'accès aujourd'hui — bande de charge par heure"
        />
        <SurfaceCard>
          <TableFrame>
            <thead>
              <TableHeadRow>
                <TableHeadCell>Heure</TableHeadCell>
                <TableHeadCell>Événements</TableHeadCell>
                <TableHeadCell>Erreurs</TableHeadCell>
                <TableHeadCell>Charge</TableHeadCell>
                <TableHeadCell>Analyse</TableHeadCell>
              </TableHeadRow>
            </thead>
            <tbody>
              {(analytics?.hours ?? [])
                .filter((h) => h.hour >= 6 && h.hour <= 22)
                .map((h) => (
                  <TableRow key={h.hour}>
                    <TableCell className="tabular">{h.label}</TableCell>
                    <TableCell className="tabular">{h.count}</TableCell>
                    <TableCell className="tabular">{h.errors}</TableCell>
                    <TableCell>
                      <StatusPill
                        size="sm"
                        tone={
                          h.band === "peak" || h.band === "high"
                            ? "warning"
                            : h.band === "medium"
                              ? "info"
                              : "success"
                        }
                      >
                        {h.band}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.count === 0
                        ? "Creux"
                        : h.band === "peak"
                          ? "Pic — surveiller latence"
                          : h.band === "high"
                            ? "Charge élevée"
                            : "Charge normale"}
                    </TableCell>
                  </TableRow>
                ))}
            </tbody>
          </TableFrame>
        </SurfaceCard>

        <SectionHeading
          title="Tables les plus touchées"
          description="Où se concentrent les accès / modifications (7 j)"
        />
        <SurfaceCard>
          {topTables.length === 0 ? (
            <TableEmpty title="Aucune table" description="Pas d'événements sur la période" />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>Table</TableHeadCell>
                  <TableHeadCell>Événements</TableHeadCell>
                  <TableHeadCell>Part</TableHeadCell>
                  <TableHeadCell>Analyse</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {topTables.map((row, index) => {
                  const share = stats.total
                    ? Math.round((row.count / stats.total) * 100)
                    : 0;
                  return (
                    <TableRow key={row.table}>
                      <TableCell className="tabular">{index + 1}</TableCell>
                      <TableCell>
                        <code className="text-xs">{row.table}</code>
                      </TableCell>
                      <TableCell className="tabular">{row.count}</TableCell>
                      <TableCell className="tabular">{share}%</TableCell>
                      <TableCell className="text-muted-foreground">
                        {share >= 30
                          ? "Point chaud — concentration d'accès"
                          : share >= 15
                            ? "Activité notable"
                            : "Activité diffuse"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>

        <SectionHeading
          title="Répartition des rôles"
          description="Comptes internes (user_roles) — lecture admin"
        />
        <SurfaceCard>
          {(analytics?.roles?.length ?? 0) === 0 ? (
            <TableEmpty
              title="Rôles non lisibles"
              description="Session admin requise pour lire user_roles (RLS)"
            />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>Rôle</TableHeadCell>
                  <TableHeadCell>Comptes</TableHeadCell>
                  <TableHeadCell>Part</TableHeadCell>
                  <TableHeadCell>Analyse</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {(() => {
                  const roles = analytics?.roles ?? [];
                  const total = roles.reduce((s, r) => s + r.count, 0) || 1;
                  return roles.map((r) => {
                    const share = Math.round((r.count / total) * 100);
                    return (
                      <TableRow key={r.role}>
                        <TableCell>{r.label}</TableCell>
                        <TableCell className="tabular">{r.count}</TableCell>
                        <TableCell className="tabular">{share}%</TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.role === "admin"
                            ? "Accès complet back-office"
                            : r.role === "formateur"
                              ? "Portail formateur"
                              : r.role === "student"
                                ? "Portail stagiaire"
                                : "Staff métier"}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </tbody>
            </TableFrame>
          )}
        </SurfaceCard>

        <SurfaceCard
          title="Journal d'exécution & modifications"
          description="Source : public.audit_log — analyse par ligne"
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
                  <TableHeadCell>Analyse</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((row) => {
                  const tone = classifyActionTone(row.action);
                  const analysis =
                    tone === "danger"
                      ? "Risque — vérifier la portée"
                      : tone === "warn"
                        ? "Modification lourde / purge"
                        : tone === "ok"
                          ? "Création / import"
                          : "Exécution / autre";
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
                      <TableCell className="text-muted-foreground">{analysis}</TableCell>
                      <TableCell>
                        <StatusPill tone={toneFromHealth(tone)} size="sm">
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

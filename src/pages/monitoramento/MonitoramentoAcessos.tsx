import { Eye, FileClock, KeyRound, PencilLine } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { useMonitoringAccessFeed } from "@/hooks/useMonitoramento";
import { classifyActionTone, toneFromHealth } from "@/lib/monitoramento";
import {
  FilterBar,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
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
import { useMemo, useState } from "react";
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
      (l) =>
        !/create|insert|import|update|patch|edit|delete|purge/i.test(l.action),
    );
  }, [logs, filter]);

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

        <StatTileGrid>
          <StatTile
            label="Consultations / lectures"
            value="via UI"
            icon={Eye}
            tone="neutral"
            hint="Instrumenter page_views (prochaine itération)"
          />
          <StatTile
            label="Créations"
            value={stats.create}
            icon={FileClock}
            tone="teal"
            hint="Entrées libérées / imports"
          />
          <StatTile
            label="Modifications"
            value={stats.update}
            icon={PencilLine}
            tone="blue"
            hint="Updates journalisés"
          />
          <StatTile
            label="Avec acteur"
            value={stats.withUser}
            icon={KeyRound}
            tone="navy"
            hint="user_id renseigné"
          />
        </StatTileGrid>

        <SurfaceCard
          title="Journal d'exécution & modifications"
          description="Source : public.audit_log — mêmes données que Qualité → Historique, filtrées pour le monitoring"
          toolbar={
            <FilterBar
              filters={
                <Select
                  value={filter}
                  onValueChange={(v) => setFilter(v as AccessFilter)}
                >
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

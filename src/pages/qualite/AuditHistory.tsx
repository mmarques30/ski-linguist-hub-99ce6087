import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Search } from "lucide-react";
import { useAuditLog } from "@/hooks/useQualiopiAudit";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FilterBar,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
} from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

const actionLabels: Record<string, { label: string; tone: PillTone }> = {
  create: { label: "Création", tone: "success" },
  update: { label: "Modification", tone: "info" },
  delete: { label: "Suppression", tone: "danger" },
};

const TABLE_OPTIONS = [
  { value: "all", label: "Toutes les tables" },
  { value: "inscriptions", label: "Inscriptions" },
  { value: "students", label: "Stagiaires" },
  { value: "invoices", label: "Factures" },
  { value: "payments", label: "Paiements" },
  { value: "sessions", label: "Sessions" },
  { value: "satisfaction_surveys", label: "Enquêtes satisfaction" },
];

export default function AuditHistory() {
  const [tableFilter, setTableFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: logs = [], isLoading } = useAuditLog({
    tableName: tableFilter !== "all" ? tableFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate ? endDate + "T23:59:59" : undefined,
    limit: 500,
  });

  const tableLabel = TABLE_OPTIONS.find((t) => t.value === tableFilter)?.label ?? tableFilter;

  const activeFilters = [
    ...(tableFilter !== "all"
      ? [{ key: "table", label: tableLabel, onRemove: () => setTableFilter("all") }]
      : []),
    ...(startDate
      ? [{ key: "start", label: `Du ${startDate}`, onRemove: () => setStartDate("") }]
      : []),
    ...(endDate
      ? [{ key: "end", label: `Au ${endDate}`, onRemove: () => setEndDate("") }]
      : []),
  ];

  const clearAll = () => {
    setTableFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Historique des modifications"
          description="Journal d'audit avec traçabilité complète"
          icon={History}
          tone="navy"
          meta={
            !isLoading && (
              <StatusPill tone="neutral">
                {logs.length} entrée{logs.length > 1 ? "s" : ""}
              </StatusPill>
            )
          }
        />

        <SurfaceCard
          toolbar={
            <FilterBar
              filters={
                <>
                  <Select value={tableFilter} onValueChange={setTableFilter}>
                    <SelectTrigger className="w-[200px]" aria-label="Table auditée">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TABLE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-[160px]"
                      placeholder="Du"
                      aria-label="Date de début"
                    />
                    <span className="text-muted-foreground" aria-hidden>→</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-[160px]"
                      placeholder="Au"
                      aria-label="Date de fin"
                    />
                  </div>
                </>
              }
              activeFilters={activeFilters}
              onClearAll={activeFilters.length > 0 ? clearAll : undefined}
            />
          }
          flush
        >
          {isLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : logs.length === 0 ? (
            <TableEmpty
              icon={Search}
              title="Aucune entrée dans le journal."
              description="Aucune modification enregistrée pour la table et la période sélectionnées."
            />
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((log) => {
                const ac = actionLabels[log.action] || actionLabels.update;
                return (
                  <li
                    key={log.id}
                    className="space-y-2 px-4 py-4 transition-colors hover:bg-[hsl(var(--surface-sunken))] sm:px-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <StatusPill tone={ac.tone} size="sm">{ac.label}</StatusPill>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {log.table_name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular">
                        {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                      </span>
                    </div>

                    {/* Les identifiants restent lisibles en entier : ils SONT l'enregistrement. */}
                    <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                          Enregistrement
                        </dt>
                        <dd
                          className="truncate font-mono text-xs text-foreground"
                          title={log.record_id ?? undefined}
                        >
                          {log.record_id ?? "—"}
                        </dd>
                      </div>
                      {log.user_id && (
                        <div className="min-w-0">
                          <dt className="text-2xs uppercase tracking-wide text-muted-foreground">
                            Utilisateur
                          </dt>
                          <dd className="truncate font-mono text-xs text-foreground" title={log.user_id}>
                            {log.user_id}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {log.action === "update" && log.old_values && log.new_values && (
                      <ChangeSummary oldValues={log.old_values} newValues={log.new_values} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChangeSummary({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  const changes: { field: string; from: string; to: string }[] = [];
  const skip = new Set(["updated_at", "created_at"]);

  for (const key of Object.keys(newValues)) {
    if (skip.has(key)) continue;
    const oldVal = JSON.stringify(oldValues?.[key] ?? null);
    const newVal = JSON.stringify(newValues[key] ?? null);
    if (oldVal !== newVal) {
      changes.push({
        field: key,
        from: oldValues?.[key]?.toString()?.slice(0, 40) ?? "—",
        to: newValues[key]?.toString()?.slice(0, 40) ?? "—",
      });
    }
  }

  if (changes.length === 0) return null;
  const shown = changes.slice(0, 3);

  return (
    <div className="space-y-1 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] px-3 py-2 text-xs">
      {shown.map((c) => (
        <p key={c.field} className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-muted-foreground">{c.field} :</span>
          <span className="text-[hsl(var(--status-critical))] line-through">{c.from}</span>
          <span className="text-muted-foreground" aria-hidden>→</span>
          <span className="font-medium text-[hsl(var(--status-good))]">{c.to}</span>
        </p>
      ))}
      {changes.length > 3 && (
        <p className="text-muted-foreground">+{changes.length - 3} autre(s) champ(s)</p>
      )}
    </div>
  );
}

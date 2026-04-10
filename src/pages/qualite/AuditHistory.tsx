import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const actionLabels: Record<string, { label: string; className: string }> = {
  create: { label: "Création", className: "bg-emerald-100 text-emerald-800" },
  update: { label: "Modification", className: "bg-blue-100 text-blue-800" },
  delete: { label: "Suppression", className: "bg-red-100 text-red-800" },
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" /> Historique des modifications
          </h1>
          <p className="text-muted-foreground">
            Journal d'audit avec traçabilité complète
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[200px]">
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
            />
            <span className="text-muted-foreground">→</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[160px]"
              placeholder="Au"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune entrée dans le journal.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {logs.map((log) => {
                  const ac = actionLabels[log.action] || actionLabels.update;
                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={ac.className}>{ac.label}</Badge>
                          <span className="text-sm font-medium">{log.table_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {log.record_id?.slice(0, 8)}...
                        {log.user_id && ` • Utilisateur: ${log.user_id.slice(0, 8)}...`}
                      </p>
                      {log.action === "update" && log.old_values && log.new_values && (
                        <ChangeSummary oldValues={log.old_values} newValues={log.new_values} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

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
    <div className="mt-2 text-xs space-y-0.5">
      {shown.map((c) => (
        <p key={c.field}>
          <span className="text-muted-foreground">{c.field}:</span>{" "}
          <span className="line-through text-red-600/70">{c.from}</span>{" → "}
          <span className="text-emerald-700">{c.to}</span>
        </p>
      ))}
      {changes.length > 3 && (
        <p className="text-muted-foreground">+{changes.length - 3} autre(s) champ(s)</p>
      )}
    </div>
  );
}

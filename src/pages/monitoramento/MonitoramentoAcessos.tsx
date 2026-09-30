import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useMonitoringAuditFeed,
  useMonitoringEmailFailures,
} from "@/hooks/useMonitoring";
import {
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";

export default function MonitoramentoAcessos() {
  const { data: audit = [], isLoading: loadingAudit } = useMonitoringAuditFeed(50);
  const { data: emails = [], isLoading: loadingEmails } = useMonitoringEmailFailures(15);

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Accès"
          description="Visualisations, entrées, logs d'exécution et modifications"
          icon={Eye}
          tone="blue"
        />

        <Alert>
          <AlertTitle>Sources</AlertTitle>
          <AlertDescription className="text-sm">
            <code className="text-xs">audit_log</code> (modifications métier) et{" "}
            <code className="text-xs">email_log</code> (exécutions d&apos;envoi). Les sessions Auth
            détaillées (IP, user-agent) arriveront via les logs Supabase Auth après branchement des
            secrets.
          </AlertDescription>
        </Alert>

        <SurfaceCard title="Journal des modifications" flush>
          {loadingAudit ? (
            <TableSkeleton rows={6} cols={3} />
          ) : audit.length === 0 ? (
            <TableEmpty title="Aucun événement d'audit." />
          ) : (
            <ul className="divide-y divide-border">
              {audit.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {row.action}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {row.table_name || "—"}
                      </span>
                    </p>
                    {row.user_id ? (
                      <p className="truncate text-xs text-muted-foreground tabular">
                        user {row.user_id}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs tabular text-muted-foreground">
                    {row.created_at
                      ? format(new Date(row.created_at), "dd MMM yyyy HH:mm", { locale: fr })
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>

        <SurfaceCard title="Logs d'exécution e-mail (échecs / ignorés)" flush>
          {loadingEmails ? (
            <TableSkeleton rows={4} cols={3} />
          ) : emails.length === 0 ? (
            <TableEmpty title="Aucun échec récent." />
          ) : (
            <ul className="divide-y divide-border">
              {emails.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        tone={toneForStatus(row.status === "failed" ? "refusee" : "en_attente")}
                        size="sm"
                      >
                        {row.status}
                      </StatusPill>
                      <span className="font-medium">{row.template_slug || "—"}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.recipient_email}
                    </p>
                    {row.error_message ? (
                      <p className="text-xs text-destructive">{row.error_message}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs tabular text-muted-foreground">
                    {row.sent_at
                      ? format(new Date(row.sent_at), "dd MMM yyyy HH:mm", { locale: fr })
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

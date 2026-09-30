import { AlertTriangle, Bot, DatabaseZap, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MonitoramentoSubnav } from "@/components/monitoramento/MonitoramentoSubnav";
import { useMonitoringSecurityFeed } from "@/hooks/useMonitoramento";
import { SENSITIVE_TABLES, classifyActionTone, toneFromHealth } from "@/lib/monitoramento";
import {
  PageHeader,
  PageShell,
  SectionHeading,
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MonitoramentoSeguranca() {
  const { data: events = [], isLoading } = useMonitoringSecurityFeed();

  const deletes = events.filter((e) => e.action.toLowerCase().includes("delete")).length;
  const securityTagged = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("securite") || a.includes("security") || a.includes("denied");
  }).length;
  const roleChanges = events.filter((e) => {
    const a = e.action.toLowerCase();
    return a.includes("role") || a.includes("permission") || e.table_name.includes("user_");
  }).length;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Sécurité"
          description="Tentatives d'intrusion, fuites, bots, expositions et durcissement des tables"
          icon={ShieldAlert}
          tone="navy"
          meta={
            <StatusPill tone={securityTagged > 0 ? "warning" : "success"} dot>
              {securityTagged} alerte{securityTagged > 1 ? "s" : ""} (7 j)
            </StatusPill>
          }
        />

        <MonitoramentoSubnav />

        <StatTileGrid>
          <StatTile
            label="Signaux sécurité"
            value={securityTagged}
            icon={ShieldAlert}
            tone={securityTagged > 0 ? "gold" : "teal"}
            hint="audit_log · securite / denied"
          />
          <StatTile
            label="Suppressions"
            value={deletes}
            icon={AlertTriangle}
            tone={deletes > 10 ? "gold" : "neutral"}
            hint="Potentiel purge / fuite"
          />
          <StatTile
            label="ACL / rôles"
            value={roleChanges}
            icon={Bot}
            tone={roleChanges > 0 ? "blue" : "neutral"}
            hint="user_roles & permissions"
          />
          <StatTile
            label="Tables sensibles"
            value={SENSITIVE_TABLES.length}
            icon={DatabaseZap}
            tone="navy"
            hint="Cartographie d'exposition"
          />
        </StatTileGrid>

        <SectionHeading
          title="Exposition des tables"
          description="Risques non mappés = tables sans revue RLS récente — à valider au cutover Supabase"
        />
        <div className="grid gap-3 md:grid-cols-2">
          {SENSITIVE_TABLES.map((table) => (
            <SurfaceCard key={table.name} title={table.name} icon={EyeOff}>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Risque :</span> {table.risk}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Exposition :</span>{" "}
                {table.exposure}
              </p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard
          title="Journal sécurité (7 jours)"
          description="Filtre sur actions sensibles — bots et IPs apparaîtront ici quand auth.audit / WAF seront branchés"
        >
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : events.length === 0 ? (
            <TableEmpty
              title="Aucun signal sécurité"
              description="Pas d'événement critique dans audit_log sur 7 jours"
            />
          ) : (
            <TableFrame>
              <thead>
                <TableHeadRow>
                  <TableHeadCell>Quand</TableHeadCell>
                  <TableHeadCell>Action</TableHeadCell>
                  <TableHeadCell>Table</TableHeadCell>
                  <TableHeadCell>IP</TableHeadCell>
                  <TableHeadCell>Sévérité</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {events.slice(0, 40).map((row) => {
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
                      <TableCell className="text-muted-foreground">
                        {row.ip_address ?? "—"}
                        {!row.ip_address && (
                          <span className="ml-1 inline-flex items-center gap-1 text-xs">
                            <Loader2 className="hidden h-3 w-3" />
                            n/a
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={toneFromHealth(tone)}>
                          {tone === "danger"
                            ? "Critique"
                            : tone === "warn"
                              ? "Attention"
                              : "Info"}
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

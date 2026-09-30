import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeAdminEdgeFunction } from "@/lib/admin-edge-invoke";
import {
  isErrorLikeAction,
  type MonitoringConfigStatus,
  type MonitoringOverviewPayload,
} from "@/lib/monitoramento";
import type { AuditLogEntry } from "@/hooks/useQualiopiAudit";

async function pingDatabase(): Promise<{ reachable: boolean; latencyMs: number | null }> {
  const started = performance.now();
  try {
    const { error } = await supabase.from("app_settings").select("key").limit(1);
    const latencyMs = Math.round(performance.now() - started);
    return { reachable: !error, latencyMs };
  } catch {
    return { reachable: false, latencyMs: null };
  }
}

export function useMonitoringConfig() {
  return useQuery({
    queryKey: ["monitoring-config"],
    queryFn: async () => {
      try {
        return await invokeAdminEdgeFunction<{
          success: boolean;
          data: MonitoringConfigStatus;
        }>("check-monitoring-config");
      } catch (error) {
        // Fonction pas encore déployée : statut local dérivé.
        const db = await pingDatabase();
        const fallback: MonitoringConfigStatus = {
          success: false,
          githubTokenConfigured: false,
          githubRepoConfigured: false,
          githubRepo: null,
          sentryDsnConfigured: false,
          databaseReachable: db.reachable,
          secrets: [],
          configured: false,
          message:
            error instanceof Error
              ? error.message
              : "Edge check-monitoring-config indisponible",
        };
        return { success: false, data: fallback };
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useMonitoringOverview() {
  return useQuery({
    queryKey: ["monitoring-overview"],
    queryFn: async (): Promise<MonitoringOverviewPayload> => {
      try {
        const payload = await invokeAdminEdgeFunction<MonitoringOverviewPayload>(
          "monitoring-overview",
        );
        if (payload?.success) return payload;
      } catch {
        // Repli client si l'edge n'est pas encore déployée.
      }

      const db = await pingDatabase();
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: auditRows } = await supabase
        .from("audit_log")
        .select("id, action, table_name, created_at, user_id")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);

      const rows = (auditRows ?? []) as AuditLogEntry[];
      const errorLike = rows.filter((r) => isErrorLikeAction(r.action)).length;
      const deletes = rows.filter((r) => r.action.toLowerCase().includes("delete")).length;

      const { count: emailFailures } = await supabase
        .from("email_log")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", since)
        .neq("status", "sent");

      return {
        success: true,
        config: {
          success: false,
          githubTokenConfigured: false,
          githubRepoConfigured: false,
          githubRepo: null,
          sentryDsnConfigured: false,
          databaseReachable: db.reachable,
          secrets: [],
          configured: false,
          message: "Mode local — déployer monitoring-overview pour GitHub / secrets.",
        },
        database: {
          reachable: db.reachable,
          latencyMs: db.latencyMs,
          auditLogCount24h: rows.length,
          errorLikeActions24h: errorLike,
          deleteActions24h: deletes,
        },
        github: {
          connected: false,
          commits: [],
          pulls: [],
          error: "Secrets GitHub non branchés ou edge non déployée",
        },
        executions: {
          emailFailures24h: emailFailures ?? 0,
          recentActions: rows.slice(0, 25).map((r) => ({
            id: r.id,
            action: r.action,
            table_name: r.table_name,
            created_at: r.created_at,
            user_id: r.user_id,
          })),
        },
      };
    },
    staleTime: 30_000,
  });
}

export function useMonitoringSecurityFeed(limit = 100) {
  return useQuery({
    queryKey: ["monitoring-security-feed", limit],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const rows = (data ?? []) as AuditLogEntry[];
      return rows.filter((r) => {
        const a = r.action.toLowerCase();
        return (
          isErrorLikeAction(a) ||
          a.includes("delete") ||
          a.includes("securite") ||
          a.includes("security") ||
          a.includes("purge") ||
          a.includes("role") ||
          a.includes("permission")
        );
      });
    },
    staleTime: 30_000,
  });
}

export function useMonitoringAccessFeed(limit = 150) {
  return useQuery({
    queryKey: ["monitoring-access-feed", limit],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditLogEntry[];
    },
    staleTime: 30_000,
  });
}

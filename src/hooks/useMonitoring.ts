import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  detectPublicMonitoringFlags,
  emailHealthTone,
  type HealthCheck,
} from "@/lib/monitoring";

const DAY_MS = 24 * 60 * 60 * 1000;

export function useMonitoringOverview() {
  return useQuery({
    queryKey: ["monitoring-overview"],
    queryFn: async () => {
      const since = new Date(Date.now() - DAY_MS).toISOString();
      const since7 = new Date(Date.now() - 7 * DAY_MS).toISOString();

      const [
        audit24,
        audit7,
        emailSent,
        emailFailed,
        emailSkipped,
        instructors,
        students,
        inscriptions,
        edgeStatus,
      ] = await Promise.all([
        supabase
          .from("audit_log")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
        supabase
          .from("audit_log")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since7),
        supabase
          .from("email_log")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent")
          .gte("sent_at", since),
        supabase
          .from("email_log")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("sent_at", since),
        supabase
          .from("email_log")
          .select("id", { count: "exact", head: true })
          .eq("status", "skipped")
          .gte("sent_at", since),
        supabase.from("instructors").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("inscriptions").select("id", { count: "exact", head: true }),
        supabase.functions
          .invoke("monitoring-status", { body: {} })
          .then((res) => res)
          .catch(() => ({ data: null, error: { message: "edge unavailable" } })),
      ]);

      const sent = emailSent.count ?? 0;
      const failed = emailFailed.count ?? 0;
      const skipped = emailSkipped.count ?? 0;
      const edgeData =
        edgeStatus && "data" in edgeStatus && edgeStatus.data && !edgeStatus.error
          ? (edgeStatus.data as {
              success?: boolean;
              githubConfigured?: boolean;
              supabaseServiceConfigured?: boolean;
              github?: {
                openPrs?: number;
                recentCommits?: number;
                defaultBranch?: string;
                error?: string;
              };
            })
          : null;

      const secrets = detectPublicMonitoringFlags(edgeData);

      const checks: HealthCheck[] = [
        {
          id: "db",
          label: "Base de données",
          tone:
            instructors.error || students.error || inscriptions.error ? "danger" : "ok",
          detail: instructors.error
            ? instructors.error.message
            : `${inscriptions.count ?? 0} inscriptions · ${students.count ?? 0} stagiaires · ${instructors.count ?? 0} formateurs`,
          href: "/monitoramento/acessos",
        },
        {
          id: "audit",
          label: "Activité audit (24 h / 7 j)",
          tone: (audit24.count ?? 0) > 0 ? "ok" : "warn",
          detail: `${audit24.count ?? 0} événements / 24 h · ${audit7.count ?? 0} / 7 j`,
          href: "/monitoramento/acessos",
        },
        {
          id: "email",
          label: "Exécution e-mails (24 h)",
          tone: emailHealthTone(failed, sent),
          detail: `${sent} envoyés · ${failed} échecs · ${skipped} ignorés`,
          href: "/admin/emails?tab=journal",
        },
        {
          id: "github",
          label: "Dépôt Git / commits",
          tone: secrets.githubConfigured
            ? edgeData?.github?.error
              ? "warn"
              : "ok"
            : "unknown",
          detail: secrets.githubConfigured
            ? edgeData?.github?.error ||
              `${edgeData?.github?.recentCommits ?? "?"} commits récents · ${edgeData?.github?.openPrs ?? "?"} PR ouvertes · branche ${edgeData?.github?.defaultBranch ?? "main"}`
            : "GITHUB_TOKEN non configuré — voir docs/MONITORAMENTO_SECRETS.md",
          href: "/monitoramento/qualidade",
        },
        {
          id: "security",
          label: "Poste sécurité",
          tone: "ok",
          detail: "Contrôles RLS / exposition / bots — détail dans Sécurité",
          href: "/monitoramento/seguranca",
        },
      ];

      return {
        checks,
        secrets,
        counts: {
          audit24: audit24.count ?? 0,
          audit7: audit7.count ?? 0,
          emailSent: sent,
          emailFailed: failed,
          emailSkipped: skipped,
          instructors: instructors.count ?? 0,
          students: students.count ?? 0,
          inscriptions: inscriptions.count ?? 0,
        },
        github: edgeData?.github ?? null,
      };
    },
    staleTime: 60_000,
  });
}

export function useMonitoringAuditFeed(limit = 40) {
  return useQuery({
    queryKey: ["monitoring-audit-feed", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, action, table_name, created_at, user_id, new_values")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMonitoringEmailFailures(limit = 20) {
  return useQuery({
    queryKey: ["monitoring-email-failures", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_log")
        .select("id, template_slug, recipient_email, status, sent_at, error_message")
        .in("status", ["failed", "skipped"])
        .order("sent_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMonitoringSecuritySignals() {
  return useQuery({
    queryKey: ["monitoring-security-signals"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * DAY_MS).toISOString();

      const [placeholderStudents, recentDeletes, rlsPolicies] = await Promise.all([
        supabase
          .from("students")
          .select("id", { count: "exact", head: true })
          .ilike("email", "%@fli.placeholder%"),
        supabase
          .from("audit_log")
          .select("id, action, table_name, created_at")
          .eq("action", "delete")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.functions.invoke("monitoring-status", { body: { include: ["rls"] } }).catch(() => ({
          data: null,
          error: { message: "edge unavailable" },
        })),
      ]);

      const edge = rlsPolicies.data as {
        rls?: { policyCount?: number; tablesWithoutRls?: string[]; error?: string };
        githubConfigured?: boolean;
      } | null;

      const checks: HealthCheck[] = [
        {
          id: "placeholder-emails",
          label: "Adresses placeholder exposées",
          tone: (placeholderStudents.count ?? 0) > 0 ? "warn" : "ok",
          detail:
            (placeholderStudents.count ?? 0) > 0
              ? `${placeholderStudents.count} fiches @fli.placeholder (hors envoi — vérifier l'affichage)`
              : "Aucune adresse placeholder détectée",
          href: "/students",
        },
        {
          id: "deletes",
          label: "Suppressions (7 j)",
          tone: (recentDeletes.data?.length ?? 0) > 20 ? "warn" : "ok",
          detail: `${recentDeletes.data?.length ?? 0} suppressions journalisées (échantillon)`,
          href: "/monitoramento/acessos",
        },
        {
          id: "rls",
          label: "RLS / tables",
          tone: edge?.rls?.error
            ? "unknown"
            : (edge?.rls?.tablesWithoutRls?.length ?? 0) > 0
              ? "danger"
              : edge?.rls?.policyCount
                ? "ok"
                : "unknown",
          detail: edge?.rls?.error
            ? edge.rls.error
            : edge?.rls?.policyCount != null
              ? `${edge.rls.policyCount} politiques · ${edge.rls.tablesWithoutRls?.length ?? 0} table(s) sans RLS`
              : "Déployer monitoring-status + SERVICE_ROLE pour le scan RLS",
          href: "/monitoramento/seguranca",
        },
        {
          id: "bots",
          label: "Bots / accès suspects",
          tone: "unknown",
          detail:
            "Nécessite journaux Auth / WAF (Lovable Cloud → Supabase Auth logs). Voir docs/MONITORAMENTO_SECRETS.md",
        },
      ];

      return {
        checks,
        recentDeletes: recentDeletes.data ?? [],
        placeholderCount: placeholderStudents.count ?? 0,
      };
    },
  });
}

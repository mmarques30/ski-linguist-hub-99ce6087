import { Link } from "react-router-dom";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { toneForHealth, type HealthCheck } from "@/lib/monitoring";

export function MonitoringCheckGrid({ checks }: { checks: HealthCheck[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {checks.map((check) => (
        <SurfaceCard key={check.id} title={check.label}>
          <div className="space-y-2">
            <StatusPill tone={toneForHealth(check.tone)} dot size="sm">
              {check.tone === "ok"
                ? "OK"
                : check.tone === "warn"
                  ? "Attention"
                  : check.tone === "danger"
                    ? "Critique"
                    : "Non branché"}
            </StatusPill>
            <p className="text-sm text-muted-foreground">{check.detail}</p>
            {check.href ? (
              <Link
                to={check.href}
                className="text-xs font-medium text-[hsl(var(--tint-blue-fg))] hover:underline"
              >
                Voir le détail
              </Link>
            ) : null}
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}

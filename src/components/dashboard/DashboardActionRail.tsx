import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { useDashboardActionItems } from "@/hooks/useDashboardActionItems";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

/**
 * Rail « À traiter aujourd'hui » — les exceptions opérationnelles, chacune
 * menant à sa liste filtrée. La gravité porte une couleur ET un libellé.
 */

const severityDot: Record<string, string> = {
  critical: "bg-[hsl(var(--status-critical))]",
  warning: "bg-[hsl(var(--status-serious))]",
  info: "bg-[hsl(var(--chart-1))]",
};

const severityCount: Record<string, string> = {
  critical: "text-[hsl(var(--status-critical))]",
  warning: "text-[hsl(var(--status-serious))]",
  info: "text-[hsl(var(--chart-1))]",
};

export function DashboardActionRail() {
  const { items, isLoading, total } = useDashboardActionItems();

  return (
    <SurfaceCard
      title="À traiter aujourd'hui"
      description="Exceptions opérationnelles — cliquer pour ouvrir la liste"
      icon={AlertTriangle}
      accent={total > 0 ? "chart-2" : "none"}
      actions={
        <StatusPill tone={total > 0 ? "danger" : "success"} icon={total > 0 ? undefined : CheckCircle2}>
          {total > 0 ? `${total} à traiter` : "Rien en attente"}
        </StatusPill>
      }
    >
      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-11 animate-shimmer rounded-[var(--radius)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucune exception : les horaires, factures et évaluations sont à jour.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="group flex items-center gap-2.5 rounded-[var(--radius)] border border-border bg-card px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-pill", severityDot[item.severity])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                <span className={cn("shrink-0 font-bold tabular", severityCount[item.severity])}>
                  {item.count}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}

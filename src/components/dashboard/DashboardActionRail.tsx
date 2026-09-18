import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardActionItems } from "@/hooks/useDashboardActionItems";
import { cn } from "@/lib/utils";

const severityDot: Record<string, string> = {
  critical: "bg-destructive",
  warning: "bg-[hsl(var(--fli-orange))]",
  info: "bg-[hsl(var(--fli-blue))]",
};

const severityText: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-[hsl(var(--fli-orange))]",
  info: "text-[hsl(var(--fli-blue))]",
};

/** Rail « À traiter aujourd'hui » — Vague B dashboard. */
export function DashboardActionRail() {
  const { items, isLoading, total } = useDashboardActionItems();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              À traiter aujourd&apos;hui
            </CardTitle>
            <CardDescription>Exceptions opérationnelles — cliquer pour ouvrir la liste</CardDescription>
          </div>
          <Badge variant={total > 0 ? "destructive" : "secondary"}>{total}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", severityDot[item.severity])}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-bold tabular-nums",
                      severityText[item.severity]
                    )}
                  >
                    {item.count}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

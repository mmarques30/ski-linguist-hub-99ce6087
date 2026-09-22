import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import {
  buildInscriptionOpsChecklist,
  checklistCompletion,
  type InscriptionOpsChecklistInput,
} from "@/lib/inscription-ops-checklist";
import { cn } from "@/lib/utils";

interface Props {
  input: InscriptionOpsChecklistInput;
}

/** Bandeau checklist opérationnelle — Vague B fiche inscription. */
export function InscriptionOpsChecklist({ input }: Props) {
  const items = buildInscriptionOpsChecklist(input);
  const { done, total } = checklistCompletion(items);

  return (
    <SurfaceCard
      title="Checklist opérationnelle"
      icon={ListChecks}
      actions={
        <StatusPill tone={done === total ? "success" : "neutral"}>
          {done}/{total}
        </StatusPill>
      }
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.href || "#"}
              className={cn(
                "flex items-start gap-2 rounded-[var(--radius)] border px-3 py-2.5 text-sm transition-colors hover:bg-[hsl(var(--surface-sunken))]",
                item.done
                  ? "border-[hsl(var(--tint-teal-ring))] bg-[hsl(var(--tint-teal-bg))]"
                  : "border-border"
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--tint-teal-fg))]" />
              ) : (
                <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className="font-medium block">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SurfaceCard>
  );
}

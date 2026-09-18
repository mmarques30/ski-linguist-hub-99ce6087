import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Checklist opérationnelle
          </CardTitle>
          <Badge variant={done === total ? "default" : "secondary"}>
            {done}/{total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={item.href || "#"}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60",
                  item.done ? "border-emerald-200 bg-emerald-50/50" : "border-border"
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
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
      </CardContent>
    </Card>
  );
}

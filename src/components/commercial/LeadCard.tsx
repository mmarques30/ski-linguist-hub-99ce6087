import { Lead, LEAD_SOURCES, EXPANSION_CHANNELS, isActionOverdue } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Euro, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  lead: Lead;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function LeadCard({ lead, onClick, draggable, onDragStart }: Props) {
  const sourceLabel = LEAD_SOURCES.find((s) => s.key === lead.source)?.label ?? lead.source;
  const channelLabel =
    EXPANSION_CHANNELS.find((c) => c.key === lead.expansion_channel)?.label ?? lead.expansion_channel;
  const overdue = isActionOverdue(lead.next_action_date);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow",
        overdue && "border-destructive/60 bg-destructive/5"
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-tight">{lead.contact_name}</p>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px]">{channelLabel}</Badge>
          <Badge variant="secondary" className="text-[10px]">{sourceLabel}</Badge>
        </div>
      </div>

      {lead.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>{lead.company}</span>
        </div>
      )}

      {lead.expansion_channel === "cpf" && lead.cpf_amount_available != null && (
        <p className="text-xs text-muted-foreground">
          CPF disponible : {Number(lead.cpf_amount_available).toLocaleString("fr-FR")} €
        </p>
      )}

      {lead.expansion_channel === "dsf" && lead.project_name && (
        <p className="text-xs text-muted-foreground truncate">Projet : {lead.project_name}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Euro className="h-3 w-3" />
          {Number(lead.estimated_revenue || 0).toLocaleString("fr-FR")} €
        </span>
        {(lead.estimated_students ?? 0) > 1 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            {lead.estimated_students}
          </span>
        )}
      </div>

      {lead.next_action && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs border-t pt-1.5",
            overdue ? "text-destructive font-medium" : "text-muted-foreground"
          )}
        >
          {overdue ? (
            <AlertTriangle className="h-3 w-3 shrink-0" />
          ) : (
            <Calendar className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{lead.next_action}</span>
          {lead.next_action_date && (
            <span className="ml-auto shrink-0">
              {format(new Date(lead.next_action_date), "dd MMM", { locale: fr })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

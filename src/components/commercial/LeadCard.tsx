import { Lead, LEAD_SOURCES } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Euro, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  lead: Lead;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function LeadCard({ lead, onClick, draggable, onDragStart }: Props) {
  const sourceLabel = LEAD_SOURCES.find((s) => s.key === lead.source)?.label ?? lead.source;

  return (
    <div
      className="rounded-lg border bg-card p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-tight">{lead.contact_name}</p>
        <Badge variant="outline" className="text-[10px] shrink-0">{sourceLabel}</Badge>
      </div>

      {lead.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>{lead.company}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Euro className="h-3 w-3" />
          {Number(lead.estimated_revenue || 0).toLocaleString("fr-FR")} €
        </span>
        {lead.estimated_students && lead.estimated_students > 1 && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            {lead.estimated_students}
          </span>
        )}
      </div>

      {lead.next_action && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-1.5">
          <Calendar className="h-3 w-3" />
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

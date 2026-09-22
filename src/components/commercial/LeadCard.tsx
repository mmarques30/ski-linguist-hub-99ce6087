import { Lead, LEAD_SOURCES, EXPANSION_CHANNELS, isActionOverdue } from "@/hooks/useLeads";
import { StatusPill } from "@/components/ui-kit";
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

/**
 * Carte de lead du kanban — profondeur du kit, jetons uniquement.
 * Une action en retard passe la carte en teinte « danger » (bordure + fond),
 * doublée d'une icône et d'un libellé : la couleur n'est jamais seule.
 */
export function LeadCard({ lead, onClick, draggable, onDragStart }: Props) {
  const sourceLabel = LEAD_SOURCES.find((s) => s.key === lead.source)?.label ?? lead.source;
  const channelLabel =
    EXPANSION_CHANNELS.find((c) => c.key === lead.expansion_channel)?.label ?? lead.expansion_channel;
  const overdue = isActionOverdue(lead.next_action_date);

  return (
    <div
      className={cn(
        "fli-surface-interactive cursor-pointer space-y-2 p-3",
        overdue &&
          "border-[hsl(var(--tint-rose-ring))] bg-[hsl(var(--tint-rose-bg))]"
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-sm font-medium leading-tight">{lead.contact_name}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusPill tone="neutral" size="sm">
            {channelLabel}
          </StatusPill>
          <StatusPill tone="info" size="sm">
            {sourceLabel}
          </StatusPill>
        </div>
      </div>

      {lead.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.company}</span>
        </div>
      )}

      {lead.expansion_channel === "cpf" && lead.cpf_amount_available != null && (
        <p className="text-xs text-muted-foreground tabular">
          CPF disponible : {Number(lead.cpf_amount_available).toLocaleString("fr-FR")} €
        </p>
      )}

      {lead.expansion_channel === "dsf" && lead.project_name && (
        <p className="truncate text-xs text-muted-foreground">Projet : {lead.project_name}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground tabular">
          <Euro className="h-3 w-3" />
          {Number(lead.estimated_revenue || 0).toLocaleString("fr-FR")} €
        </span>
        {(lead.estimated_students ?? 0) > 1 && (
          <span className="flex items-center gap-1 text-muted-foreground tabular">
            <User className="h-3 w-3" />
            {lead.estimated_students}
          </span>
        )}
      </div>

      {lead.next_action && (
        <div
          className={cn(
            "flex items-center gap-1.5 border-t border-border pt-1.5 text-xs",
            overdue ? "font-medium text-[hsl(var(--tint-rose-fg))]" : "text-muted-foreground"
          )}
        >
          {overdue ? (
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          ) : (
            <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          )}
          <span className="truncate">{lead.next_action}</span>
          {lead.next_action_date && (
            <span className="ml-auto shrink-0 tabular">
              {format(new Date(lead.next_action_date), "dd MMM", { locale: fr })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

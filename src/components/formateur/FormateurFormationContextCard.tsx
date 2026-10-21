import { Calendar, MapPin, User } from "lucide-react";
import type { FormateurFormationContext } from "@/lib/formateur-formation-forms";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { DefinitionList, SurfaceCard } from "@/components/ui-kit";

/**
 * Bandeau contexte mission — prérempli depuis l'inscription
 * (remplace la re-saisie nom / dates / formation du Google Form).
 */
export function FormateurFormationContextCard({
  context,
}: {
  context: FormateurFormationContext;
}) {
  const formationLabel = [
    context.language ? displayLanguageLabel(context.language) : null,
    context.location?.trim() || null,
    context.modality?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const dates = inscriptionDateRangeLabel({
    start_date: context.startDate ?? null,
    end_date: context.endDate ?? null,
  });

  return (
    <SurfaceCard title="Mission" icon={User}>
      <DefinitionList
        columns={2}
        items={[
          {
            label: "Stagiaire",
            value: context.studentName?.trim() || "—",
          },
          {
            label: "Dossier",
            value: context.inscriptionCode?.trim() || "—",
          },
          {
            label: "Formation",
            value: formationLabel || "—",
          },
          {
            label: "Période",
            value: (
              <span className="inline-flex items-center gap-1 tabular">
                <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                {dates || "—"}
              </span>
            ),
          },
          ...(context.location
            ? [
                {
                  label: "Lieu",
                  value: (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                      {context.location}
                    </span>
                  ),
                },
              ]
            : []),
          {
            label: "Formateur·rice",
            value: context.formateurName?.trim() || "—",
          },
          ...(context.durationHours != null
            ? [
                {
                  label: "Durée prévue",
                  value: `${context.durationHours} h`,
                },
              ]
            : []),
        ]}
      />
    </SurfaceCard>
  );
}

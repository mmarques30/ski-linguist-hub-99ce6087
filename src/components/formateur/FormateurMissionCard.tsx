import { Link } from "react-router";
import { Calendar, Clock, MapPin, School } from "lucide-react";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import type { FormateurInscriptionRow } from "@/lib/formateur-portal";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { getStatusLabel } from "@/lib/inscription-status";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { StatusPill, toneForStatus } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Carte mission — qui, où, quand, langue, horaires, école.
 */
export function FormateurMissionCard({
  row,
  className,
  showOpenLink = true,
}: {
  row: FormateurInscriptionRow;
  className?: string;
  showOpenLink?: boolean;
}) {
  const { basePath } = useFormateurView();

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius)] border border-border p-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium">
          {row.student_name || "Stagiaire"}
          {row.code ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {row.code}
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular">
            <Clock className="h-3 w-3 shrink-0" />
            {inscriptionDateRangeLabel(row)}
          </span>
          {row.course_location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {row.course_location}
            </span>
          ) : null}
          {row.schedule ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {row.schedule}
            </span>
          ) : null}
          {row.ski_school_name ? (
            <span className="inline-flex items-center gap-1">
              <School className="h-3 w-3 shrink-0" />
              {row.ski_school_name}
            </span>
          ) : null}
        </div>
        {(row.modality || row.rhythm) && (
          <p className="text-xs text-muted-foreground">
            {[row.modality, row.rhythm].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap gap-1 sm:justify-end">
          {row.language ? (
            <StatusPill tone="neutral" size="sm">
              {displayLanguageLabel(row.language)}
            </StatusPill>
          ) : null}
          <StatusPill tone={toneForStatus(row.status)} size="sm">
            {getStatusLabel(row.status || "", "fr")}
          </StatusPill>
        </div>
        {showOpenLink ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`${basePath}/missions/${row.id}`}>Voir la mission</Link>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

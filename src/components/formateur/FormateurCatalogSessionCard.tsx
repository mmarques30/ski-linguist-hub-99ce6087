import { Calendar, Clock, MapPin } from "lucide-react";
import type { FormateurCatalogSession } from "@/lib/formateur-portal";
import { inscriptionDateRangeLabel } from "@/lib/registration-dates";
import { StatusPill } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

/**
 * Carte session catalogue — lieu / dates / langue, même sans stagiaires inscrits.
 */
export function FormateurCatalogSessionCard({
  session,
  className,
}: {
  session: FormateurCatalogSession;
  className?: string;
}) {
  const dates =
    session.start_date || session.end_date
      ? inscriptionDateRangeLabel({
          start_date: session.start_date,
          end_date: session.end_date,
        })
      : session.date_label || "Dates à préciser";

  const enrollmentTone =
    session.enrollment_status === "waitlist"
      ? "warning"
      : session.enrollment_status === "invite_only"
        ? "info"
        : "success";
  const enrollmentLabel =
    session.enrollment_status === "waitlist"
      ? "Liste d'attente"
      : session.enrollment_status === "invite_only"
        ? "Sur invitation"
        : session.enrollment_status === "open"
          ? "Inscriptions ouvertes"
          : "Session planifiée";

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius)] border border-border border-dashed p-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium">
          {session.location_label}
          {session.session_code ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {session.session_code}
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular">
            <Clock className="h-3 w-3 shrink-0" />
            {dates}
          </span>
          {session.format_label ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {session.format_label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {session.modality_label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {[
            session.modality_label,
            session.duration_hours != null ? `${session.duration_hours} h` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          {" · "}
          Pas encore d’inscrits
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap gap-1 sm:justify-end">
          {session.language_label ? (
            <StatusPill tone="neutral" size="sm">
              {session.language_label}
            </StatusPill>
          ) : null}
          <StatusPill tone={enrollmentTone} size="sm">
            {enrollmentLabel}
          </StatusPill>
        </div>
      </div>
    </li>
  );
}

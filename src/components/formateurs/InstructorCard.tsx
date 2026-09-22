import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Pencil, Star } from "lucide-react";
import type { Instructor } from "@/hooks/useInstructors";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { candidatActivationGaps } from "@/lib/instructor-candidat";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

const availabilityTones: Record<string, PillTone> = {
  disponible: "success",
  occupe: "warning",
  indisponible: "danger",
};

const statusTones: Record<string, PillTone> = {
  actif: "success",
  inactif: "neutral",
  candidat: "info",
};

const statusLabels: Record<string, string> = {
  actif: "Actif·ve",
  inactif: "Inactif·ve",
  candidat: "Candidat·e",
};

/** Teinte par langue enseignée — jetons uniquement, pas de couleur en dur. */
const languageTones: Record<string, PillTone> = {
  anglais: "info",
  "portugais brésilien": "success",
  portugais: "success",
  russe: "danger",
  néerlandais: "accent",
  fle: "purple",
  espagnol: "warning",
  italien: "danger",
  allemand: "warning",
  chinois: "neutral",
};

interface Props {
  instructor: Instructor;
  onClick: () => void;
  onEdit?: () => void;
  onActivate?: () => void;
}

export function InstructorCard({ instructor, onClick, onEdit, onActivate }: Props) {
  const initials =
    (instructor.first_name?.[0] || "") + (instructor.last_name?.[0] || "");
  const isCandidat = instructor.status === "candidat";
  const gaps = isCandidat ? candidatActivationGaps(instructor) : [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Ouvrir la fiche de ${instructor.first_name} ${instructor.last_name}`}
      className="cursor-pointer rounded-[var(--radius-card)]"
    >
      <SurfaceCard interactive bodyClassName="flex items-start gap-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={instructor.photo_url || undefined} />
          <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold">
              {instructor.first_name} {instructor.last_name}
            </h3>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
              {instructor.status && (
                <StatusPill tone={statusTones[instructor.status] ?? "neutral"} size="sm">
                  {statusLabels[instructor.status] || instructor.status}
                </StatusPill>
              )}
              {instructor.status === "actif" && (
                <StatusPill
                  tone={
                    availabilityTones[instructor.availability_status || "disponible"] ?? "success"
                  }
                  size="sm"
                >
                  {instructor.availability_status || "disponible"}
                </StatusPill>
              )}
              {onEdit && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Modifier"
                  aria-label="Modifier"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(instructor.languages || []).map((l) => (
              <StatusPill key={l} tone={languageTones[l.toLowerCase()] ?? "neutral"} size="sm">
                {displayLanguageLabel(l)}
              </StatusPill>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {instructor.hourly_rate && (
              <span className="tabular">{instructor.hourly_rate} €/h</span>
            )}
            {(instructor.rating_average ?? 0) > 0 && (
              <span className="flex items-center gap-1 tabular">
                <Star className="h-3 w-3 fill-[hsl(var(--tint-gold-fg))] text-[hsl(var(--tint-gold-fg))]" />
                {Number(instructor.rating_average).toFixed(1)}
              </span>
            )}
          </div>

          {isCandidat && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {gaps.length > 0 ? (
                <span className="text-xs text-[hsl(var(--tint-blue-fg))]">
                  {gaps.length} point{gaps.length > 1 ? "s" : ""} à compléter
                </span>
              ) : (
                <span className="text-xs text-[hsl(var(--status-good))]">Dossier prêt</span>
              )}
              {onActivate && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivate();
                  }}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Passer en actif·ve
                </Button>
              )}
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Pencil, Star } from "lucide-react";
import type { Instructor } from "@/hooks/useInstructors";
import { displayLanguageLabel } from "@/lib/taught-languages";
import { candidatActivationGaps } from "@/lib/instructor-candidat";

const availabilityStyles: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-800",
  occupe: "bg-amber-100 text-amber-800",
  indisponible: "bg-red-100 text-red-800",
};

const statusStyles: Record<string, string> = {
  actif: "bg-emerald-100 text-emerald-800",
  inactif: "bg-slate-100 text-slate-700",
  candidat: "bg-sky-100 text-sky-800",
};

const statusLabels: Record<string, string> = {
  actif: "Actif·ve",
  inactif: "Inactif·ve",
  candidat: "Candidat·e",
};

const languageColors: Record<string, string> = {
  anglais: "bg-blue-100 text-blue-800",
  "portugais brésilien": "bg-green-100 text-green-800",
  portugais: "bg-green-100 text-green-800",
  russe: "bg-red-100 text-red-800",
  néerlandais: "bg-orange-100 text-orange-800",
  fle: "bg-violet-100 text-violet-800",
  espagnol: "bg-amber-100 text-amber-800",
  italien: "bg-rose-100 text-rose-800",
  allemand: "bg-yellow-100 text-yellow-800",
  chinois: "bg-cyan-100 text-cyan-800",
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
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={instructor.photo_url || undefined} />
          <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate">
              {instructor.first_name} {instructor.last_name}
            </h3>
            <div className="flex shrink-0 items-center gap-1">
              {instructor.status && (
                <Badge className={statusStyles[instructor.status] || statusStyles.inactif}>
                  {statusLabels[instructor.status] || instructor.status}
                </Badge>
              )}
              {instructor.status === "actif" && (
                <Badge
                  className={
                    availabilityStyles[instructor.availability_status || "disponible"] ||
                    availabilityStyles.disponible
                  }
                >
                  {instructor.availability_status || "disponible"}
                </Badge>
              )}
              {onEdit && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Modifier"
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
              <Badge
                key={l}
                variant="outline"
                className={languageColors[l.toLowerCase()] || ""}
              >
                {displayLanguageLabel(l)}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {instructor.hourly_rate && (
              <span>{instructor.hourly_rate} €/h</span>
            )}
            {(instructor.rating_average ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(instructor.rating_average).toFixed(1)}
              </span>
            )}
          </div>
          {isCandidat && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {gaps.length > 0 ? (
                <span className="text-xs text-sky-800">
                  {gaps.length} point{gaps.length > 1 ? "s" : ""} à compléter
                </span>
              ) : (
                <span className="text-xs text-emerald-700">Dossier prêt</span>
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
      </CardContent>
    </Card>
  );
}

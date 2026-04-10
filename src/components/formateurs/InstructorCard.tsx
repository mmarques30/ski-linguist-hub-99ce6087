import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { Instructor } from "@/hooks/useInstructors";

const availabilityStyles: Record<string, string> = {
  disponible: "bg-emerald-100 text-emerald-800",
  occupe: "bg-amber-100 text-amber-800",
  indisponible: "bg-red-100 text-red-800",
};

const languageColors: Record<string, string> = {
  anglais: "bg-blue-100 text-blue-800",
  portugais: "bg-green-100 text-green-800",
  russe: "bg-red-100 text-red-800",
  néerlandais: "bg-orange-100 text-orange-800",
};

interface Props {
  instructor: Instructor;
  onClick: () => void;
}

export function InstructorCard({ instructor, onClick }: Props) {
  const initials =
    (instructor.first_name?.[0] || "") + (instructor.last_name?.[0] || "");

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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold truncate">
              {instructor.first_name} {instructor.last_name}
            </h3>
            <Badge
              className={
                availabilityStyles[instructor.availability_status || "disponible"] ||
                availabilityStyles.disponible
              }
            >
              {instructor.availability_status || "disponible"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {(instructor.languages || []).map((l) => (
              <Badge
                key={l}
                variant="outline"
                className={languageColors[l.toLowerCase()] || ""}
              >
                {l}
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
        </div>
      </CardContent>
    </Card>
  );
}

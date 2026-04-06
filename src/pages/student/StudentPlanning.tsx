import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useStudentProfile, useStudentSessions } from "@/hooks/useStudentPortal";
import { format, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

export default function StudentPlanning() {
  const { data: student } = useStudentProfile();
  const { data: sessions, isLoading } = useStudentSessions(student?.id);

  const now = new Date();
  const upcoming = (sessions || []).filter((s: any) =>
    isAfter(new Date(s.start_datetime), now)
  );
  const past = (sessions || []).filter((s: any) =>
    isBefore(new Date(s.end_datetime), now)
  );

  const SessionCard = ({ session }: { session: any }) => (
    <div className="flex items-start justify-between p-3 rounded-lg border">
      <div className="space-y-1">
        <p className="font-medium text-sm">{session.title}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(session.start_datetime), "EEEE d MMMM — HH:mm", {
              locale: fr,
            })}{" "}
            à {format(new Date(session.end_datetime), "HH:mm")}
          </span>
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.location}
              {session.room ? ` — ${session.room}` : ""}
            </span>
          )}
          {session.instructors && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {session.instructors.first_name} {session.instructors.last_name}
            </span>
          )}
        </div>
      </div>
      <Badge variant="outline" className="shrink-0">
        {session.language}
      </Badge>
    </div>
  );

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mon planning</h1>
          <p className="text-muted-foreground text-sm">
            Consultez vos sessions de formation à venir
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Sessions à venir ({upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length > 0 ? (
                  upcoming.map((s: any) => (
                    <SessionCard key={s.id} session={s} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucune session programmée.
                  </p>
                )}
              </CardContent>
            </Card>

            {past.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-muted-foreground">
                    Sessions passées ({past.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {past.map((s: any) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

import { Calendar, MapPin, Users, GraduationCap } from "lucide-react";

interface ClassSession {
  id: string;
  language: string;
  level: string;
  location: string;
  date: string;
  time: string;
  enrolled: number;
  capacity: number;
}

const classes: ClassSession[] = [];

export function UpcomingClasses() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">Próximas Turmas</h3>
        <p className="text-sm text-muted-foreground">Próximas sessões de treinamento agendadas</p>
      </div>
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">Nenhuma turma agendada</p>
          <p className="text-sm text-muted-foreground">
            As turmas aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {classes.map((session) => (
            <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{session.language}</p>
                  <p className="text-sm text-muted-foreground">Nível {session.level}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  session.enrolled >= session.capacity 
                    ? "bg-red-100 text-red-700" 
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {session.enrolled >= session.capacity ? "Lotado" : `${session.capacity - session.enrolled} vagas disponíveis`}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {session.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {session.enrolled}/{session.capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t p-4">
        <button className="text-sm font-medium text-primary hover:underline">
          Gerenciar todas as turmas
        </button>
      </div>
    </div>
  );
}

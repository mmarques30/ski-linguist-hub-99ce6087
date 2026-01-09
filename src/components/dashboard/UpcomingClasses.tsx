import { Calendar, MapPin, Users } from "lucide-react";

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

// Mock data - will be replaced with real data from Supabase
const mockClasses: ClassSession[] = [
  {
    id: "1",
    language: "Inglês",
    level: "A2-B1",
    location: "Val d'Isère",
    date: "15 Jan, 2026",
    time: "Manhã",
    enrolled: 8,
    capacity: 12,
  },
  {
    id: "2",
    language: "Português",
    level: "B1-B2",
    location: "Courchevel",
    date: "16 Jan, 2026",
    time: "Tarde",
    enrolled: 6,
    capacity: 10,
  },
  {
    id: "3",
    language: "Russo",
    level: "A1-A2",
    location: "Méribel",
    date: "18 Jan, 2026",
    time: "Manhã",
    enrolled: 10,
    capacity: 10,
  },
];

export function UpcomingClasses() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">Próximas Turmas</h3>
        <p className="text-sm text-muted-foreground">Próximas sessões de treinamento agendadas</p>
      </div>
      <div className="divide-y">
        {mockClasses.map((session) => (
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
      <div className="border-t p-4">
        <button className="text-sm font-medium text-primary hover:underline">
          Gerenciar todas as turmas
        </button>
      </div>
    </div>
  );
}

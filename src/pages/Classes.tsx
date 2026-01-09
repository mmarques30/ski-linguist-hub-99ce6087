import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Users, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassSession {
  id: string;
  language: string;
  level: string;
  location: string;
  startDate: string;
  endDate: string;
  time: "morning" | "afternoon";
  instructor: string;
  enrolled: number;
  capacity: number;
  status: "upcoming" | "active" | "completed";
}

const mockClasses: ClassSession[] = [
  {
    id: "CLS-001",
    language: "Inglês",
    level: "A2-B1",
    location: "Val d'Isère",
    startDate: "2026-01-15",
    endDate: "2026-01-20",
    time: "morning",
    instructor: "Paula Rangel",
    enrolled: 8,
    capacity: 12,
    status: "upcoming",
  },
  {
    id: "CLS-002",
    language: "Português",
    level: "B1-B2",
    location: "Courchevel",
    startDate: "2026-01-16",
    endDate: "2026-01-21",
    time: "afternoon",
    instructor: "Paula Rangel",
    enrolled: 6,
    capacity: 10,
    status: "upcoming",
  },
  {
    id: "CLS-003",
    language: "Russo",
    level: "A1-A2",
    location: "Méribel",
    startDate: "2026-01-10",
    endDate: "2026-01-15",
    time: "morning",
    instructor: "Paula Rangel",
    enrolled: 10,
    capacity: 10,
    status: "active",
  },
  {
    id: "CLS-004",
    language: "Holandês",
    level: "B1-B2",
    location: "Les Arcs",
    startDate: "2026-01-05",
    endDate: "2026-01-10",
    time: "afternoon",
    instructor: "Paula Rangel",
    enrolled: 8,
    capacity: 10,
    status: "completed",
  },
];

const statusStyles = {
  upcoming: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  upcoming: "Próxima",
  active: "Ativa",
  completed: "Concluída",
};

const timeLabels = {
  morning: "08:00 - 12:00",
  afternoon: "14:00 - 18:00",
};

export default function Classes() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Turmas</h1>
            <p className="text-muted-foreground">
              Gerencie sessões de treinamento e alocação de alunos
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Turma
          </Button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Janeiro 2026</h2>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Idiomas</SelectItem>
                <SelectItem value="english">Inglês</SelectItem>
                <SelectItem value="portuguese">Português</SelectItem>
                <SelectItem value="russian">Russo</SelectItem>
                <SelectItem value="dutch">Holandês</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Localidades</SelectItem>
                <SelectItem value="valdisere">Val d'Isère</SelectItem>
                <SelectItem value="courchevel">Courchevel</SelectItem>
                <SelectItem value="meribel">Méribel</SelectItem>
                <SelectItem value="lesarcs">Les Arcs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {mockClasses.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{session.language}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Nível {session.level}
                    </p>
                  </div>
                  <Badge className={cn(statusStyles[session.status])}>
                    {statusLabels[session.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{session.startDate} - {session.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{timeLabels[session.time]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{session.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.enrolled}/{session.capacity} inscrito(s)</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacidade</span>
                    <span className={cn(
                      "font-medium",
                      session.enrolled >= session.capacity ? "text-red-600" : "text-emerald-600"
                    )}>
                      {session.enrolled >= session.capacity 
                        ? "Lotada" 
                        : `${session.capacity - session.enrolled} vagas disponíveis`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        session.enrolled >= session.capacity 
                          ? "bg-red-500" 
                          : "bg-primary"
                      )}
                      style={{ width: `${(session.enrolled / session.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    Ver Alunos
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Editar Turma
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

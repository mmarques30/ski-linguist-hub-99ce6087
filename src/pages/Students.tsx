import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Filter, Download, Eye, Mail, Phone, Grid, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  skiSchool: string;
  languages: { name: string; level: string }[];
  status: "active" | "inactive" | "completed";
  coursesCompleted: number;
  lastActivity: string;
  avatar?: string;
}

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  completed: "Concluído",
};

const mockStudents: Student[] = [
  {
    id: "STU-001",
    name: "Jean-Pierre Dubois",
    email: "jp.dubois@esf.fr",
    phone: "+33 6 12 34 56 78",
    skiSchool: "ESF Val d'Isère",
    languages: [
      { name: "Inglês", level: "B1" },
      { name: "Português", level: "A2" },
    ],
    status: "active",
    coursesCompleted: 3,
    lastActivity: "2026-01-08",
  },
  {
    id: "STU-002",
    name: "Marie Laurent",
    email: "m.laurent@esf.fr",
    phone: "+33 6 98 76 54 32",
    skiSchool: "ESF Courchevel",
    languages: [{ name: "Português", level: "B2" }],
    status: "active",
    coursesCompleted: 5,
    lastActivity: "2026-01-07",
  },
  {
    id: "STU-003",
    name: "Pierre Martin",
    email: "p.martin@esf.fr",
    phone: "+33 6 11 22 33 44",
    skiSchool: "ESF Méribel",
    languages: [{ name: "Russo", level: "A1" }],
    status: "active",
    coursesCompleted: 1,
    lastActivity: "2026-01-06",
  },
  {
    id: "STU-004",
    name: "Sophie Bernard",
    email: "s.bernard@esf.fr",
    phone: "+33 6 55 66 77 88",
    skiSchool: "ESF Les Arcs",
    languages: [
      { name: "Holandês", level: "C1" },
      { name: "Inglês", level: "B2" },
    ],
    status: "completed",
    coursesCompleted: 8,
    lastActivity: "2025-12-15",
  },
  {
    id: "STU-005",
    name: "Lucas Moreau",
    email: "l.moreau@esf.fr",
    phone: "+33 6 22 33 44 55",
    skiSchool: "ESF Chamonix",
    languages: [{ name: "Inglês", level: "B1" }],
    status: "inactive",
    coursesCompleted: 2,
    lastActivity: "2025-11-20",
  },
];

export default function Students() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Alunos</h1>
            <p className="text-muted-foreground">
              Gerencie seu banco de dados e perfis de alunos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou escola..."
                className="pl-10"
              />
            </div>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Student Grid */}
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {mockStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.skiSchool}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(statusStyles[student.status], "hover:opacity-80")}>
                    {statusLabels[student.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {student.languages.map((lang) => (
                    <Badge key={lang.name} variant="outline">
                      {lang.name} - {lang.level}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cursos</p>
                    <p className="font-medium">{student.coursesCompleted} concluídos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última Atividade</p>
                    <p className="font-medium">{student.lastActivity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Perfil
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando 1-5 de 5 alunos
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

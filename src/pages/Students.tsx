import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, Eye, Mail, Phone, Grid, List, Users, Loader2, Building2, Plus, Pencil } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { format } from "date-fns";
import { fr, enUS, ptBR } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";

// Translations for the Students page
const translations = {
  title: {
    fr: "Stagiaires",
    "pt-BR": "Estagiários",
    en: "Students"
  },
  subtitle: {
    fr: "Gérez votre base de données et profils de stagiaires",
    "pt-BR": "Gerencie seu banco de dados e perfis de estagiários",
    en: "Manage your student database and profiles"
  },
  export: {
    fr: "Exporter",
    "pt-BR": "Exportar",
    en: "Export"
  },
  searchPlaceholder: {
    fr: "Rechercher par nom, email ou entreprise...",
    "pt-BR": "Pesquisar por nome, email ou empresa...",
    en: "Search by name, email or company..."
  },
  loadingError: {
    fr: "Erreur de chargement",
    "pt-BR": "Erro de carregamento",
    en: "Loading error"
  },
  noStudents: {
    fr: "Aucun stagiaire inscrit",
    "pt-BR": "Nenhum estagiário inscrito",
    en: "No students registered"
  },
  noStudentsDescription: {
    fr: "Les stagiaires apparaîtront ici après avoir complété leurs inscriptions ou après importation.",
    "pt-BR": "Os estagiários aparecerão aqui após completarem suas inscrições ou após importação.",
    en: "Students will appear here after completing their registrations or after import."
  },
  student: {
    fr: "Stagiaire",
    "pt-BR": "Estagiário",
    en: "Student"
  },
  email: {
    fr: "Email",
    "pt-BR": "Email",
    en: "Email"
  },
  phone: {
    fr: "Téléphone",
    "pt-BR": "Telefone",
    en: "Phone"
  },
  city: {
    fr: "Ville",
    "pt-BR": "Cidade",
    en: "City"
  },
  company: {
    fr: "Entreprise",
    "pt-BR": "Empresa",
    en: "Company"
  },
  registration: {
    fr: "Inscription",
    "pt-BR": "Inscrição",
    en: "Registration"
  },
  actions: {
    fr: "Actions",
    "pt-BR": "Ações",
    en: "Actions"
  },
  cityNotProvided: {
    fr: "Ville non renseignée",
    "pt-BR": "Cidade não informada",
    en: "City not provided"
  },
  viewProfile: {
    fr: "Voir le profil",
    "pt-BR": "Ver perfil",
    en: "View profile"
  },
  showing: {
    fr: "Affichage de",
    "pt-BR": "Exibindo",
    en: "Showing"
  },
  students: {
    fr: "stagiaires",
    "pt-BR": "estagiários",
    en: "students"
  },
  previous: {
    fr: "Précédent",
    "pt-BR": "Anterior",
    en: "Previous"
  },
  next: {
    fr: "Suivant",
    "pt-BR": "Próximo",
    en: "Next"
  },
  newStudent: {
    fr: "Nouveau stagiaire",
    "pt-BR": "Novo estagiário",
    en: "New Student"
  },
  edit: {
    fr: "Modifier",
    "pt-BR": "Editar",
    en: "Edit"
  }
};

export default function Students() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { language, t } = useLanguage();

  const { data: students, isLoading, error } = useStudents({
    search: search || undefined,
  });

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const getDateLocale = () => {
    switch (language) {
      case "pt-BR": return ptBR;
      case "en": return enUS;
      default: return fr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: getDateLocale() });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">
              {t(translations.subtitle)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t(translations.export)}
            </Button>
            <Button size="sm" onClick={handleCreateStudent}>
              <Plus className="mr-2 h-4 w-4" />
              {t(translations.newStudent)}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(translations.searchPlaceholder)}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
            <Users className="h-12 w-12 text-destructive/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.loadingError)}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">{error.message}</p>
          </div>
        ) : !students || students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.noStudents)}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {t(translations.noStudentsDescription)}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(translations.student)}</TableHead>
                  <TableHead>{t(translations.email)}</TableHead>
                  <TableHead>{t(translations.phone)}</TableHead>
                  <TableHead>{t(translations.city)}</TableHead>
                  <TableHead>{t(translations.company)}</TableHead>
                  <TableHead>{t(translations.registration)}</TableHead>
                  <TableHead className="text-right">{t(translations.actions)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                        <span className="font-medium">
                          {student.first_name} {student.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.phone || "-"}</TableCell>
                    <TableCell>{student.city || "-"}</TableCell>
                    <TableCell>
                      {student.company ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Building2 className="h-3 w-3" />
                          {student.company}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{formatDate(student.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => navigate(`/students/${student.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditStudent(student)}
                          title={t(translations.edit)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                        {getInitials(student.first_name, student.last_name)}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.city || t(translations.cityNotProvided)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student.company && (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Building2 className="h-3 w-3" />
                      {student.company}
                    </Badge>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t(translations.email)}</p>
                      <p className="font-medium truncate">{student.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t(translations.phone)}</p>
                      <p className="font-medium">{student.phone || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t(translations.viewProfile)}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditStudent(student)}
                      title={t(translations.edit)}
                    >
                      <Pencil className="h-4 w-4" />
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
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t(translations.showing)} {students?.length || 0} {t(translations.students)}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              {t(translations.previous)}
            </Button>
            <Button variant="outline" size="sm" disabled>
              {t(translations.next)}
            </Button>
          </div>
        </div>
      </div>

      <StudentFormDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
      />
    </MainLayout>
  );
}

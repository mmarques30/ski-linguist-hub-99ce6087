import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Award,
  BookOpen,
  TrendingUp,
  Loader2,
  User,
  GraduationCap,
  Languages,
} from "lucide-react";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useStudentDetails(id);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Terminé":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Facturé":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "En cours":
        return "bg-primary/10 text-primary border-primary/20";
      case "Annulé":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getLevelColor = (level: string | null) => {
    if (!level) return "bg-muted text-muted-foreground";
    if (level.startsWith("A")) return "bg-orange-500/10 text-orange-600";
    if (level.startsWith("B")) return "bg-blue-500/10 text-blue-600";
    if (level.startsWith("C")) return "bg-emerald-500/10 text-emerald-600";
    return "bg-muted text-muted-foreground";
  };

  const getLevelProgress = (level: string | null) => {
    const levelMap: Record<string, number> = {
      A1: 16.67,
      A2: 33.33,
      B1: 50,
      B2: 66.67,
      C1: 83.33,
      C2: 100,
    };
    return levelMap[level || ""] || 0;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error || !student) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <User className="h-12 w-12 text-destructive/50 mb-4" />
          <h3 className="text-lg font-medium">Aluno não encontrado</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {error?.message || "O aluno solicitado não existe ou foi removido."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Alunos
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Get the best certification result
  const bestCertification = student.inscriptions
    .filter((i) => i.certification_result && i.certification_result !== "N/A")
    .sort((a, b) => {
      const levelOrder = ["C2", "C1", "B2", "B1", "A2", "A1"];
      return (
        levelOrder.indexOf(a.certification_result || "") -
        levelOrder.indexOf(b.certification_result || "")
      );
    })[0];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/students")}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">
                {getInitials(student.first_name, student.last_name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {student.first_name} {student.last_name}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                  {student.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {student.email}
                    </span>
                  )}
                  {student.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {student.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Enviar Email
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.stats.totalInscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {student.stats.completedCourses} cursos concluídos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas de Curso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.stats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Total acumulado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificações</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.stats.certifications}</div>
              <p className="text-xs text-muted-foreground">
                {bestCertification
                  ? `Melhor: ${bestCertification.certification_result}`
                  : "Nenhuma certificação"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idiomas</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.stats.languages.length}</div>
              <p className="text-xs text-muted-foreground">
                {student.stats.languages.slice(0, 2).join(", ")}
                {student.stats.languages.length > 2 && "..."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Student Info */}
          <div className="space-y-6">
            {/* Contact & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                {student.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">{student.phone}</p>
                    </div>
                  </div>
                )}
                {(student.city || student.street_address) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-muted-foreground">
                        {[student.street_address, student.postal_code, student.city]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                )}
                {student.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Empresa</p>
                      <p className="text-sm text-muted-foreground">{student.company}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cliente desde</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(student.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress by Language */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso por Idioma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.stats.languages.length > 0 ? (
                  student.stats.languages.map((language) => {
                    const langInscriptions = student.inscriptions.filter(
                      (i) => i.language === language
                    );
                    const lastCert = langInscriptions.find(
                      (i) => i.certification_result && i.certification_result !== "N/A"
                    );
                    const level = lastCert?.certification_result || langInscriptions[0]?.entry_level;

                    return (
                      <div key={language} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{language}</span>
                          {level && (
                            <Badge variant="outline" className={getLevelColor(level)}>
                              {level}
                            </Badge>
                          )}
                        </div>
                        <Progress value={getLevelProgress(level)} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {langInscriptions.length} inscrição(ões)
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum idioma registrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Inscriptions History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Histórico de Inscrições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">Todas ({student.inscriptions.length})</TabsTrigger>
                    <TabsTrigger value="completed">
                      Concluídas ({student.stats.completedCourses})
                    </TabsTrigger>
                    <TabsTrigger value="certifications">
                      Com Certificação ({student.stats.certifications})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="m-0">
                    <InscriptionTable inscriptions={student.inscriptions} />
                  </TabsContent>

                  <TabsContent value="completed" className="m-0">
                    <InscriptionTable
                      inscriptions={student.inscriptions.filter(
                        (i) => i.status === "Terminé" || i.status === "Facturé"
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="certifications" className="m-0">
                    <InscriptionTable
                      inscriptions={student.inscriptions.filter(
                        (i) => i.certification_result && i.certification_result !== "N/A"
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function InscriptionTable({ inscriptions }: { inscriptions: any[] }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Terminé":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Facturé":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "En cours":
        return "bg-primary/10 text-primary border-primary/20";
      case "Annulé":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getLevelColor = (level: string | null) => {
    if (!level) return "bg-muted text-muted-foreground";
    if (level.startsWith("A")) return "bg-orange-500/10 text-orange-600";
    if (level.startsWith("B")) return "bg-blue-500/10 text-blue-600";
    if (level.startsWith("C")) return "bg-emerald-500/10 text-emerald-600";
    return "bg-muted text-muted-foreground";
  };

  if (inscriptions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma inscrição encontrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Idioma</TableHead>
            <TableHead>Modalidade</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Certificação</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inscriptions.map((inscription) => (
            <TableRow key={inscription.id}>
              <TableCell className="font-medium">{inscription.code || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{inscription.language}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {inscription.modality || "-"}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(inscription.start_date)} - {formatDate(inscription.end_date)}
              </TableCell>
              <TableCell>{inscription.duration_hours ? `${inscription.duration_hours}h` : "-"}</TableCell>
              <TableCell>
                {inscription.certification_result && inscription.certification_result !== "N/A" ? (
                  <Badge className={getLevelColor(inscription.certification_result)}>
                    {inscription.certification_result}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(inscription.status)}>
                  {inscription.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

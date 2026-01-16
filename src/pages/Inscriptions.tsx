import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, ClipboardList, Upload, Loader2, Package, MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInscriptions, useUpdateInscriptionStatus } from "@/hooks/useInscriptions";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { EndPackDialog } from "@/components/endpack/EndPackDialog";
import { InscriptionFormDialog } from "@/components/inscriptions/InscriptionFormDialog";
import { toast } from "sonner";
const translations = {
  title: {
    fr: "Inscriptions",
    "pt-BR": "Inscrições",
    en: "Enrollments",
  },
  subtitle: {
    fr: "Gérer les inscriptions et candidatures des stagiaires",
    "pt-BR": "Gerenciar inscrições e candidaturas de estagiários",
    en: "Manage student enrollments and applications",
  },
  importCSV: {
    fr: "Importer CSV",
    "pt-BR": "Importar CSV",
    en: "Import CSV",
  },
  export: {
    fr: "Exporter",
    "pt-BR": "Exportar",
    en: "Export",
  },
  newInscription: {
    fr: "Nouvelle inscription",
    "pt-BR": "Nova inscrição",
    en: "New Enrollment",
  },
  searchPlaceholder: {
    fr: "Rechercher par nom, email ou code...",
    "pt-BR": "Buscar por nome, e-mail ou código...",
    en: "Search by name, email or code...",
  },
  allStatuses: {
    fr: "Tous les statuts",
    "pt-BR": "Todos os status",
    en: "All statuses",
  },
  statusInProgress: {
    fr: "En cours",
    "pt-BR": "Em andamento",
    en: "In Progress",
  },
  statusBilled: {
    fr: "Facturée",
    "pt-BR": "Faturada",
    en: "Billed",
  },
  statusCompleted: {
    fr: "Terminée",
    "pt-BR": "Concluída",
    en: "Completed",
  },
  statusCancelled: {
    fr: "Annulée",
    "pt-BR": "Cancelada",
    en: "Cancelled",
  },
  allLanguages: {
    fr: "Toutes les langues",
    "pt-BR": "Todos os idiomas",
    en: "All languages",
  },
  english: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  },
  portuguese: {
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
  },
  italian: {
    fr: "Italien",
    "pt-BR": "Italiano",
    en: "Italian",
  },
  german: {
    fr: "Allemand",
    "pt-BR": "Alemão",
    en: "German",
  },
  code: {
    fr: "Code",
    "pt-BR": "Código",
    en: "Code",
  },
  student: {
    fr: "Stagiaire",
    "pt-BR": "Estagiário",
    en: "Student",
  },
  skiSchool: {
    fr: "École de ski",
    "pt-BR": "Escola de ski",
    en: "Ski School",
  },
  language: {
    fr: "Langue",
    "pt-BR": "Idioma",
    en: "Language",
  },
  level: {
    fr: "Niveau",
    "pt-BR": "Nível",
    en: "Level",
  },
  period: {
    fr: "Période",
    "pt-BR": "Período",
    en: "Period",
  },
  amount: {
    fr: "Montant",
    "pt-BR": "Valor",
    en: "Amount",
  },
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  },
  actions: {
    fr: "Actions",
    "pt-BR": "Ações",
    en: "Actions",
  },
  loadingError: {
    fr: "Erreur de chargement",
    "pt-BR": "Erro ao carregar",
    en: "Loading error",
  },
  noInscriptionsTitle: {
    fr: "Aucune inscription trouvée",
    "pt-BR": "Nenhuma inscrição encontrada",
    en: "No enrollments found",
  },
  noInscriptionsDesc: {
    fr: "Les inscriptions apparaîtront ici lorsque les stagiaires s'inscriront ou après importation de données.",
    "pt-BR": "As inscrições aparecerão aqui quando os estagiários se inscreverem ou após a importação de dados.",
    en: "Enrollments will appear here when students enroll or after data import.",
  },
  showing: {
    fr: "Affichage de",
    "pt-BR": "Exibindo",
    en: "Showing",
  },
  inscriptions: {
    fr: "inscriptions",
    "pt-BR": "inscrições",
    en: "enrollments",
  },
  previous: {
    fr: "Précédent",
    "pt-BR": "Anterior",
    en: "Previous",
  },
  next: {
    fr: "Suivant",
    "pt-BR": "Próximo",
    en: "Next",
  },
  statusUpdated: {
    fr: "Statut mis à jour",
    "pt-BR": "Status atualizado",
    en: "Status updated",
  },
};

const statusStyles: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-800",
  "Facturé": "bg-emerald-100 text-emerald-800",
  "Terminée": "bg-gray-100 text-gray-800",
  "Terminé": "bg-gray-100 text-gray-800",
  "Annulée": "bg-red-100 text-red-800",
  "Annulé": "bg-red-100 text-red-800",
};

const statusOptions = [
  { value: "En cours", icon: Clock, color: "text-blue-600" },
  { value: "Terminée", icon: CheckCircle, color: "text-gray-600" },
  { value: "Annulée", icon: XCircle, color: "text-red-600" },
];

export default function Inscriptions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [endPackInscription, setEndPackInscription] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { language, t } = useLanguage();
  const updateStatus = useUpdateInscriptionStatus();

  const { data: inscriptions, isLoading, error, refetch } = useInscriptions({
    status: statusFilter,
    language: languageFilter,
    search: search || undefined,
  });

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

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    const locale = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const statusLabels: Record<string, string> = {
    "En cours": t(translations.statusInProgress),
    "Facturé": t(translations.statusBilled),
    "Terminée": t(translations.statusCompleted),
    "Terminé": t(translations.statusCompleted),
    "Annulée": t(translations.statusCancelled),
    "Annulé": t(translations.statusCancelled),
  };

  const handleStatusChange = async (inscriptionId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: inscriptionId, status: newStatus });
      toast.success(t(translations.statusUpdated));
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
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
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/import">
                <Upload className="mr-2 h-4 w-4" />
                {t(translations.importCSV)}
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t(translations.export)}
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t(translations.newInscription)}
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t(translations.status)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(translations.allStatuses)}</SelectItem>
              <SelectItem value="En cours">{t(translations.statusInProgress)}</SelectItem>
              <SelectItem value="Facturé">{t(translations.statusBilled)}</SelectItem>
              <SelectItem value="Terminé">{t(translations.statusCompleted)}</SelectItem>
              <SelectItem value="Annulé">{t(translations.statusCancelled)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t(translations.language)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(translations.allLanguages)}</SelectItem>
              <SelectItem value="Anglais">{t(translations.english)}</SelectItem>
              <SelectItem value="Portugais brésilien">{t(translations.portuguese)}</SelectItem>
              <SelectItem value="Italien">{t(translations.italian)}</SelectItem>
              <SelectItem value="Allemand">{t(translations.german)}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-destructive/50 mb-4" />
              <h3 className="text-lg font-medium">{t(translations.loadingError)}</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {error.message}
              </p>
            </div>
          ) : !inscriptions || inscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t(translations.noInscriptionsTitle)}</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {t(translations.noInscriptionsDesc)}
              </p>
              <Button asChild className="mt-4">
                <Link to="/admin/import">
                  <Upload className="mr-2 h-4 w-4" />
                  {t(translations.importCSV)}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(translations.code)}</TableHead>
                  <TableHead>{t(translations.student)}</TableHead>
                  <TableHead>{t(translations.skiSchool)}</TableHead>
                  <TableHead>{t(translations.language)}</TableHead>
                  <TableHead>{t(translations.level)}</TableHead>
                  <TableHead>{t(translations.period)}</TableHead>
                  <TableHead>{t(translations.amount)}</TableHead>
                  <TableHead>{t(translations.status)}</TableHead>
                  <TableHead className="text-right">{t(translations.actions)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell className="font-mono text-sm">
                      {inscription.code || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inscription.student_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">
                          {inscription.student_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{inscription.ski_school_name || "-"}</TableCell>
                    <TableCell>{inscription.language}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inscription.entry_level || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(inscription.start_date)} - {formatDate(inscription.end_date)}
                      </span>
                    </TableCell>
                    <TableCell>{formatPrice(inscription.price)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                            <Badge className={cn(statusStyles[inscription.status] || "bg-gray-100 text-gray-800", "hover:opacity-80 cursor-pointer")}>
                              {statusLabels[inscription.status] || inscription.status}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {statusOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleStatusChange(inscription.id, option.value)}
                                disabled={inscription.status === option.value || updateStatus.isPending}
                              >
                                <Icon className={cn("mr-2 h-4 w-4", option.color)} />
                                {statusLabels[option.value]}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEndPackInscription({
                                id: inscription.id,
                                student_id: inscription.student_id,
                                student_name: inscription.student_name,
                                language: inscription.language,
                                entry_level: inscription.entry_level,
                                exit_level: inscription.exit_level,
                                duration_hours: inscription.duration_hours,
                                price: inscription.price,
                                code: inscription.code,
                              })}
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Pack Fin de Formation
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t(translations.showing)} {inscriptions?.length || 0} {t(translations.inscriptions)}
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

      {/* End Pack Dialog */}
      {endPackInscription && (
        <EndPackDialog
          open={!!endPackInscription}
          onOpenChange={(open) => !open && setEndPackInscription(null)}
          inscription={endPackInscription}
          onSuccess={() => refetch()}
        />
      )}

      {/* Create Inscription Dialog */}
      <InscriptionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </MainLayout>
  );
}

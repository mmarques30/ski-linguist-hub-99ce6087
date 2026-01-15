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
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, ClipboardList, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInscriptions } from "@/hooks/useInscriptions";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage, Translations } from "@/contexts/LanguageContext";

const translations = {
  title: {
    fr: "Inscriptions",
    "pt-BR": "Inscrições",
    en: "Registrations",
  } as Translations,
  subtitle: {
    fr: "Gérer les inscriptions et candidatures des stagiaires",
    "pt-BR": "Gerenciar inscrições e candidaturas de estagiários",
    en: "Manage student registrations and applications",
  } as Translations,
  importCSV: {
    fr: "Importer CSV",
    "pt-BR": "Importar CSV",
    en: "Import CSV",
  } as Translations,
  export: {
    fr: "Exporter",
    "pt-BR": "Exportar",
    en: "Export",
  } as Translations,
  newInscription: {
    fr: "Nouvelle inscription",
    "pt-BR": "Nova inscrição",
    en: "New registration",
  } as Translations,
  searchPlaceholder: {
    fr: "Rechercher par nom, email ou code...",
    "pt-BR": "Pesquisar por nome, email ou código...",
    en: "Search by name, email or code...",
  } as Translations,
  allStatuses: {
    fr: "Tous les statuts",
    "pt-BR": "Todos os status",
    en: "All statuses",
  } as Translations,
  inProgress: {
    fr: "En cours",
    "pt-BR": "Em andamento",
    en: "In progress",
  } as Translations,
  billed: {
    fr: "Facturée",
    "pt-BR": "Faturada",
    en: "Billed",
  } as Translations,
  finished: {
    fr: "Terminée",
    "pt-BR": "Concluída",
    en: "Completed",
  } as Translations,
  cancelled: {
    fr: "Annulée",
    "pt-BR": "Cancelada",
    en: "Cancelled",
  } as Translations,
  allLanguages: {
    fr: "Toutes les langues",
    "pt-BR": "Todos os idiomas",
    en: "All languages",
  } as Translations,
  english: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  } as Translations,
  portuguese: {
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
  } as Translations,
  italian: {
    fr: "Italien",
    "pt-BR": "Italiano",
    en: "Italian",
  } as Translations,
  german: {
    fr: "Allemand",
    "pt-BR": "Alemão",
    en: "German",
  } as Translations,
  loadingError: {
    fr: "Erreur de chargement",
    "pt-BR": "Erro ao carregar",
    en: "Loading error",
  } as Translations,
  noInscription: {
    fr: "Aucune inscription trouvée",
    "pt-BR": "Nenhuma inscrição encontrada",
    en: "No registration found",
  } as Translations,
  noInscriptionDescription: {
    fr: "Les inscriptions apparaîtront ici lorsque les stagiaires s'inscriront ou après importation de données.",
    "pt-BR": "As inscrições aparecerão aqui quando os estagiários se inscreverem ou após importação de dados.",
    en: "Registrations will appear here when students register or after data import.",
  } as Translations,
  code: {
    fr: "Code",
    "pt-BR": "Código",
    en: "Code",
  } as Translations,
  student: {
    fr: "Stagiaire",
    "pt-BR": "Estagiário",
    en: "Student",
  } as Translations,
  skiSchool: {
    fr: "École de ski",
    "pt-BR": "Escola de esqui",
    en: "Ski school",
  } as Translations,
  language: {
    fr: "Langue",
    "pt-BR": "Idioma",
    en: "Language",
  } as Translations,
  level: {
    fr: "Niveau",
    "pt-BR": "Nível",
    en: "Level",
  } as Translations,
  period: {
    fr: "Période",
    "pt-BR": "Período",
    en: "Period",
  } as Translations,
  amount: {
    fr: "Montant",
    "pt-BR": "Valor",
    en: "Amount",
  } as Translations,
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  } as Translations,
  actions: {
    fr: "Actions",
    "pt-BR": "Ações",
    en: "Actions",
  } as Translations,
  showing: {
    fr: "Affichage de",
    "pt-BR": "Exibindo",
    en: "Showing",
  } as Translations,
  inscriptions: {
    fr: "inscriptions",
    "pt-BR": "inscrições",
    en: "registrations",
  } as Translations,
  previous: {
    fr: "Précédent",
    "pt-BR": "Anterior",
    en: "Previous",
  } as Translations,
  next: {
    fr: "Suivant",
    "pt-BR": "Próximo",
    en: "Next",
  } as Translations,
};

const statusStyles: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-800",
  "Facturé": "bg-emerald-100 text-emerald-800",
  "Terminé": "bg-gray-100 text-gray-800",
  "Annulé": "bg-red-100 text-red-800",
};

export default function Inscriptions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { language, t } = useLanguage();

  const { data: inscriptions, isLoading, error } = useInscriptions({
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
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, Translations> = {
      "En cours": translations.inProgress,
      "Facturé": translations.billed,
      "Terminé": translations.finished,
      "Annulé": translations.cancelled,
    };
    return statusMap[status] ? t(statusMap[status]) : status;
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
            <Button size="sm">
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
              <SelectItem value="En cours">{t(translations.inProgress)}</SelectItem>
              <SelectItem value="Facturé">{t(translations.billed)}</SelectItem>
              <SelectItem value="Terminé">{t(translations.finished)}</SelectItem>
              <SelectItem value="Annulé">{t(translations.cancelled)}</SelectItem>
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
              <h3 className="text-lg font-medium">{t(translations.noInscription)}</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {t(translations.noInscriptionDescription)}
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
                      <Badge className={cn(statusStyles[inscription.status] || "bg-gray-100 text-gray-800", "hover:opacity-80")}>
                        {getStatusLabel(inscription.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </MainLayout>
  );
}

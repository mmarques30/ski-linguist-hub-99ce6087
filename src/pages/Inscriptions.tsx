import { useEffect, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Eye, Edit, Trash2, ClipboardList, Upload, Loader2, Package, MoreHorizontal } from "lucide-react";
import { useInscriptions, useDeleteInscription } from "@/hooks/useInscriptions";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import { DueStatusAdvanceCard } from "@/components/inscriptions/DueStatusAdvanceCard";
import { InscriptionStatusMenu } from "@/components/inscriptions/InscriptionStatusMenu";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { LANGUAGE_LABELS } from "@/lib/language-catalog";
import { EndPackDialog } from "@/components/endpack/EndPackDialog";
import { InscriptionFormDialog } from "@/components/inscriptions/InscriptionFormDialog";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ListSkeleton } from "@/components/common/ListSkeleton";
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
    fr: "Portugais brésilien",
    "pt-BR": "Português brasileiro",
    en: "Brazilian Portuguese",
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
  inscriptionSingular: {
    fr: "inscription",
    "pt-BR": "inscrição",
    en: "enrollment",
  },
  inscriptions: {
    fr: "inscriptions",
    "pt-BR": "inscrições",
    en: "enrollments",
  },
  statusUpdated: {
    fr: "Statut mis à jour",
    "pt-BR": "Status atualizado",
    en: "Status updated",
  },
};

export default function Inscriptions() {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const languageFromUrl = searchParams.get("language");
  const [statusFilter, setStatusFilter] = useState(
    () => statusFromUrl || "all"
  );
  const [languageFilter, setLanguageFilter] = useState(
    () => languageFromUrl || "all"
  );
  const [search, setSearch] = useState("");
  const [endPackInscription, setEndPackInscription] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingInscription, setEditingInscription] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inscriptionToDelete, setInscriptionToDelete] = useState<{ id: string; name: string } | null>(null);
  const { language, t } = useLanguage();
  const { seasonId, seasonStart, seasonEnd } = useSeasonFilter();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("inscriptions");
  const deleteInscription = useDeleteInscription();

  useEffect(() => {
    if (statusFromUrl) setStatusFilter(statusFromUrl);
  }, [statusFromUrl]);

  // Les répartitions du tableau de bord pointent ici avec ?language=…
  useEffect(() => {
    if (languageFromUrl) setLanguageFilter(languageFromUrl);
  }, [languageFromUrl]);

  const { data: inscriptions, isLoading, error, refetch } = useInscriptions({
    status: statusFilter,
    language: languageFilter,
    search: search || undefined,
    seasonId,
    seasonStart,
    seasonEnd,
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

  const handleDeleteClick = (inscription: { id: string; student_name: string | null; code: string | null }) => {
    setInscriptionToDelete({
      id: inscription.id,
      name: inscription.student_name || inscription.code || inscription.id,
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!inscriptionToDelete) return;
    try {
      await deleteInscription.mutateAsync(inscriptionToDelete.id);
      toast.success("Inscription supprimée avec succès");
      setDeleteDialogOpen(false);
      setInscriptionToDelete(null);
    } catch (error: any) {
      console.error("Error deleting inscription:", error);
      toast.error(error.message || "Erreur lors de la suppression");
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
            {editable && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/import">
                  <Upload className="mr-2 h-4 w-4" />
                  {t(translations.importCSV)}
                </Link>
              </Button>
            )}
            {editable && (
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t(translations.newInscription)}
              </Button>
            )}
          </div>
        </div>

        {editable && <DueStatusAdvanceCard />}

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
              <SelectItem value="brouillon">{language === "pt-BR" ? "Rascunho" : language === "en" ? "Draft" : "Brouillon"}</SelectItem>
              <SelectItem value="en_attente">{language === "pt-BR" ? "Pendente" : language === "en" ? "Pending" : "En attente"}</SelectItem>
              <SelectItem value="confirmee">{language === "pt-BR" ? "Confirmada" : language === "en" ? "Confirmed" : "Confirmée"}</SelectItem>
              <SelectItem value="en_cours">{t(translations.statusInProgress)}</SelectItem>
              <SelectItem value="terminee">{t(translations.statusCompleted)}</SelectItem>
              <SelectItem value="facturee">{t(translations.statusBilled)}</SelectItem>
              <SelectItem value="annulee">{t(translations.statusCancelled)}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t(translations.language)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(translations.allLanguages)}</SelectItem>
              {LANGUAGE_LABELS.map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <ListSkeleton rows={6} />
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
                      {inscription.dates_to_confirm ? (
                        <span className="text-sm text-muted-foreground">
                          {DATES_A_PLANIFIER_LABEL}
                          <span className="block text-xs">
                            souhaité le {formatDate(inscription.start_date)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm">
                          {formatDate(inscription.start_date)} - {formatDate(inscription.end_date)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatPrice(inscription.price)}</TableCell>
                    <TableCell>
                      <InscriptionStatusMenu
                        inscriptionId={inscription.id}
                        status={inscription.status || ""}
                        startDate={inscription.start_date}
                        readOnly={!editable}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/inscriptions/${inscription.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {editable && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setEditingInscription(inscription)}
                            >
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
                                    start_date: inscription.start_date,
                                    end_date: inscription.end_date,
                                    duration_hours: inscription.duration_hours,
                                    price: inscription.price,
                                    deposit_amount:
                                      (inscription as { deposit_amount?: number | null })
                                        .deposit_amount ?? null,
                                    balance_after_deposit:
                                      (inscription as { balance_after_deposit?: number | null })
                                        .balance_after_deposit ?? null,
                                    code: inscription.code,
                                    course_location: inscription.course_location,
                                    modality: inscription.modality,
                                    formateur: inscription.instructor_name,
                                    status: inscription.status,
                                  })}
                                >
                                  <Package className="mr-2 h-4 w-4" />
                                  Pack Fin de Formation
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(inscription)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {inscriptions && inscriptions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t(translations.showing)}{" "}
            {inscriptions.length}{" "}
            {inscriptions.length === 1
              ? t(translations.inscriptionSingular)
              : t(translations.inscriptions)}
          </p>
        )}
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

      {/* Create/Edit Inscription Dialog */}
      <InscriptionFormDialog
        open={createDialogOpen || !!editingInscription}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingInscription(null);
          }
        }}
        inscription={editingInscription}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'inscription de{" "}
              <strong>{inscriptionToDelete?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInscriptionToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInscription.isPending}
            >
              {deleteInscription.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

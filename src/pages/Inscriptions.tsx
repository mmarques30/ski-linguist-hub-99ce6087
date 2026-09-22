import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ClipboardList,
  Upload,
  Loader2,
  Package,
  MoreHorizontal,
  Clock,
  PlayCircle,
  CheckCircle2,
  Database,
  ChartPie,
  Languages,
} from "lucide-react";
import {
  useInscriptions,
  useDeleteInscription,
  useInscriptionStats,
} from "@/hooks/useInscriptions";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import { DueStatusAdvanceCard } from "@/components/inscriptions/DueStatusAdvanceCard";
import { InscriptionStatusMenu } from "@/components/inscriptions/InscriptionStatusMenu";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { LANGUAGE_LABELS } from "@/lib/language-catalog";
import { getStatusLabel } from "@/lib/inscription-status";
import { EndPackDialog } from "@/components/endpack/EndPackDialog";
import { InscriptionFormDialog } from "@/components/inscriptions/InscriptionFormDialog";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  CardList,
  CardListItem,
  DonutChart,
  FilterBar,
  IdentityCell,
  PageHeader,
  PageShell,
  RankedBarList,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableCell,
  TableEmpty,
  TableFrame,
  TableHeadCell,
  TableHeadRow,
  TableRow,
  TableSkeleton,
} from "@/components/ui-kit";
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
  // Libellés ajoutés par la refonte visuelle (tuiles, filtres, vue mobile).
  displayed: {
    fr: "Inscriptions affichées",
    "pt-BR": "Inscrições exibidas",
    en: "Enrollments shown",
  },
  inResults: {
    fr: "dans les résultats affichés",
    "pt-BR": "nos resultados exibidos",
    en: "in the current results",
  },
  searchChip: {
    fr: "Recherche",
    "pt-BR": "Busca",
    en: "Search",
  },
  view: {
    fr: "Voir",
    "pt-BR": "Ver",
    en: "View",
  },
  edit: {
    fr: "Modifier",
    "pt-BR": "Editar",
    en: "Edit",
  },
  // Bandeau de synthèse — libellés ajoutés par la densification visuelle.
  tileTotalBase: {
    fr: "Total en base",
    "pt-BR": "Total na base",
    en: "Total on file",
  },
  wholePortfolio: {
    fr: "toute la base, filtres exclus",
    "pt-BR": "toda a base, sem filtros",
    en: "whole database, filters excluded",
  },
  byStatus: {
    fr: "Répartition par statut",
    "pt-BR": "Distribuição por status",
    en: "Breakdown by status",
  },
  byLanguage: {
    fr: "Langues les plus demandées",
    "pt-BR": "Idiomas mais procurados",
    en: "Most requested languages",
  },
  portfolioScope: {
    fr: "Comptage réel sur l'ensemble des inscriptions — indépendant des filtres et de la saison ci-dessous.",
    "pt-BR": "Contagem real sobre todas as inscrições — independente dos filtros e da temporada abaixo.",
    en: "Real count over every enrolment — independent of the filters and season below.",
  },
  noData: {
    fr: "Aucune donnée disponible",
    "pt-BR": "Nenhum dado disponível",
    en: "No data available",
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
  const { seasonId, seasonStart, seasonEnd, season } = useSeasonFilter();
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

  /**
   * Compteurs des résultats déjà chargés — aucune requête supplémentaire.
   * Chaque tuile applique le filtre de statut correspondant à la liste.
   */
  const counts = useMemo(() => {
    const rows = inscriptions ?? [];
    const byStatus = (code: string) => rows.filter((i) => i.status === code).length;
    return {
      total: rows.length,
      en_attente: byStatus("en_attente"),
      en_cours: byStatus("en_cours"),
      terminee: byStatus("terminee"),
    };
  }, [inscriptions]);

  /**
   * Répartitions du portefeuille complet. `useInscriptionStats` compte la
   * table entière : ces chiffres sont globaux, contrairement aux tuiles de
   * statut ci-dessus qui portent sur les résultats affichés.
   */
  const { data: portfolio, isLoading: portfolioLoading } = useInscriptionStats();

  const statusSlices = useMemo(
    () =>
      Object.entries(portfolio?.byStatus ?? {})
        .map(([status, count]) => ({
          name: getStatusLabel(status, language),
          value: count as number,
          href: `/inscriptions?status=${status}`,
        }))
        .sort((a, b) => b.value - a.value),
    [portfolio, language]
  );

  const languageBars = useMemo(
    () =>
      Object.entries(portfolio?.byLanguage ?? {})
        .map(([name, count]) => ({
          key: name,
          label: name,
          value: count as number,
          href: `/inscriptions?language=${encodeURIComponent(name)}`,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [portfolio]
  );

  const activeFilters: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `${t(translations.status)} : ${getStatusLabel(statusFilter, language)}`,
      onRemove: () => setStatusFilter("all"),
    });
  }
  if (languageFilter !== "all") {
    activeFilters.push({
      key: "language",
      label: `${t(translations.language)} : ${languageFilter}`,
      onRemove: () => setLanguageFilter("all"),
    });
  }
  if (search) {
    activeFilters.push({
      key: "search",
      label: `${t(translations.searchChip)} : ${search}`,
      onRemove: () => setSearch(""),
    });
  }

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

  const endPackPayload = (inscription: any) => ({
    id: inscription.id,
    student_id: inscription.student_id,
    student_name: inscription.student_name,
    language: inscription.language,
    start_date: inscription.start_date,
    end_date: inscription.end_date,
    duration_hours: inscription.duration_hours,
    price: inscription.price,
    deposit_amount:
      (inscription as { deposit_amount?: number | null }).deposit_amount ?? null,
    balance_after_deposit:
      (inscription as { balance_after_deposit?: number | null })
        .balance_after_deposit ?? null,
    code: inscription.code,
    course_location: inscription.course_location,
    modality: inscription.modality,
    formateur: inscription.instructor_name,
    status: inscription.status,
  });

  /** Période — même contenu que la colonne du tableau, réutilisé en mobile. */
  const renderPeriod = (inscription: any) =>
    inscription.dates_to_confirm ? (
      <span className="text-sm text-muted-foreground">
        {DATES_A_PLANIFIER_LABEL}
        <span className="block text-xs">
          souhaité le {formatDate(inscription.start_date)}
        </span>
      </span>
    ) : (
      <span className="text-sm tabular">
        {formatDate(inscription.start_date)} - {formatDate(inscription.end_date)}
      </span>
    );

  /** Actions de ligne — identiques en tableau et en carte mobile. */
  const rowActions = (inscription: any) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link to={`/inscriptions/${inscription.id}`} aria-label={t(translations.view)}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      {editable && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t(translations.edit)}
            onClick={() => setEditingInscription(inscription)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t(translations.actions)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setEndPackInscription(endPackPayload(inscription))}
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
  );

  const listBody = isLoading ? (
    <TableSkeleton rows={6} cols={6} />
  ) : error ? (
    <TableEmpty
      title={t(translations.loadingError)}
      description={error.message}
      icon={ClipboardList}
    />
  ) : !inscriptions || inscriptions.length === 0 ? (
    <TableEmpty
      title={t(translations.noInscriptionsTitle)}
      description={t(translations.noInscriptionsDesc)}
      icon={ClipboardList}
      action={
        <Button asChild>
          <Link to="/admin/import">
            <Upload className="mr-2 h-4 w-4" />
            {t(translations.importCSV)}
          </Link>
        </Button>
      }
    />
  ) : (
    <>
      <TableFrame className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <TableHeadRow>
              <TableHeadCell>{t(translations.code)}</TableHeadCell>
              <TableHeadCell>{t(translations.student)}</TableHeadCell>
              <TableHeadCell className="hidden lg:table-cell">
                {t(translations.skiSchool)}
              </TableHeadCell>
              <TableHeadCell className="hidden md:table-cell">
                {t(translations.language)}
              </TableHeadCell>
              <TableHeadCell className="hidden xl:table-cell">
                {t(translations.level)}
              </TableHeadCell>
              <TableHeadCell className="hidden lg:table-cell">
                {t(translations.period)}
              </TableHeadCell>
              <TableHeadCell align="right" className="hidden md:table-cell">
                {t(translations.amount)}
              </TableHeadCell>
              <TableHeadCell>{t(translations.status)}</TableHeadCell>
              <TableHeadCell align="right">{t(translations.actions)}</TableHeadCell>
            </TableHeadRow>
          </thead>
          <tbody>
            {inscriptions.map((inscription) => (
              <TableRow key={inscription.id}>
                <TableCell className="font-mono">
                  {inscription.code || "-"}
                </TableCell>
                <TableCell>
                  <IdentityCell
                    name={inscription.student_name || "N/A"}
                    secondary={inscription.student_email}
                    to={
                      inscription.student_id
                        ? `/students/${inscription.student_id}`
                        : undefined
                    }
                  />
                </TableCell>
                <TableCell hideBelow="lg">{inscription.ski_school_name || "-"}</TableCell>
                <TableCell hideBelow="md">{inscription.language}</TableCell>
                <TableCell hideBelow="xl">
                  <Badge variant="outline">{inscription.entry_level || "-"}</Badge>
                </TableCell>
                <TableCell hideBelow="lg">{renderPeriod(inscription)}</TableCell>
                <TableCell align="right" hideBelow="md" className="tabular">
                  {formatPrice(inscription.price)}
                </TableCell>
                <TableCell>
                  <InscriptionStatusMenu
                    inscriptionId={inscription.id}
                    status={inscription.status || ""}
                    startDate={inscription.start_date}
                    readOnly={!editable}
                  />
                </TableCell>
                <TableCell align="right">{rowActions(inscription)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </TableFrame>

      {/* Doublure mobile du tableau — aucune colonne perdue sous 768px. */}
      <CardList className="md:hidden">
        {inscriptions.map((inscription) => (
          <CardListItem
            key={inscription.id}
            title={
              inscription.student_id ? (
                <Link
                  to={`/students/${inscription.student_id}`}
                  className="hover:underline"
                >
                  {inscription.student_name || "N/A"}
                </Link>
              ) : (
                inscription.student_name || "N/A"
              )
            }
            subtitle={inscription.student_email}
            meta={
              <InscriptionStatusMenu
                inscriptionId={inscription.id}
                status={inscription.status || ""}
                startDate={inscription.start_date}
                readOnly={!editable}
              />
            }
            fields={[
              { label: t(translations.code), value: inscription.code || "-" },
              { label: t(translations.language), value: inscription.language },
              {
                label: t(translations.skiSchool),
                value: inscription.ski_school_name || "-",
              },
              {
                label: t(translations.level),
                value: inscription.entry_level || "-",
              },
              { label: t(translations.period), value: renderPeriod(inscription) },
              { label: t(translations.amount), value: formatPrice(inscription.price) },
            ]}
            actions={rowActions(inscription)}
          />
        ))}
      </CardList>
    </>
  );

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={ClipboardList}
          tone="gold"
          meta={
            season ? <StatusPill tone="info">{season.name}</StatusPill> : undefined
          }
          actions={
            <>
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
            </>
          }
        />

        {editable && <DueStatusAdvanceCard />}

        {/*
          Compteurs des résultats chargés — chaque tuile applique son filtre.
          Seule la première tuile est globale : elle vient du comptage de la
          table entière, les quatre suivantes portent sur les lignes affichées.
        */}
        <StatTileGrid cols={5}>
          <StatTile
            label={t(translations.tileTotalBase)}
            value={portfolio?.total ?? 0}
            hint={t(translations.wholePortfolio)}
            icon={Database}
            tone="navy"
            loading={portfolioLoading}
            onClick={() => {
              setStatusFilter("all");
              setLanguageFilter("all");
              setSearch("");
            }}
          />
          <StatTile
            label={t(translations.displayed)}
            value={counts.total}
            hint={`${t(translations.showing)} ${counts.total} ${
              counts.total === 1
                ? t(translations.inscriptionSingular)
                : t(translations.inscriptions)
            }`}
            icon={ClipboardList}
            tone="gold"
            loading={isLoading}
            onClick={() => setStatusFilter("all")}
          />
          <StatTile
            label={getStatusLabel("en_attente", language)}
            value={counts.en_attente}
            hint={t(translations.inResults)}
            icon={Clock}
            tone="orange"
            loading={isLoading}
            onClick={() => setStatusFilter("en_attente")}
          />
          <StatTile
            label={getStatusLabel("en_cours", language)}
            value={counts.en_cours}
            hint={t(translations.inResults)}
            icon={PlayCircle}
            tone="teal"
            loading={isLoading}
            onClick={() => setStatusFilter("en_cours")}
          />
          <StatTile
            label={getStatusLabel("terminee", language)}
            value={counts.terminee}
            hint={t(translations.inResults)}
            icon={CheckCircle2}
            tone="purple"
            loading={isLoading}
            onClick={() => setStatusFilter("terminee")}
          />
        </StatTileGrid>

        {/*
          Répartitions du portefeuille complet : un segment ou une ligne ouvre
          la liste filtrée correspondante (?status= / ?language=).
        */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title={t(translations.byStatus)}
            description={t(translations.portfolioScope)}
            icon={ChartPie}
          >
            {portfolioLoading ? (
              <div className="h-[190px] animate-shimmer rounded-[var(--radius)]" />
            ) : (
              <DonutChart
                data={statusSlices}
                height={150}
                thickness={18}
                legendPosition="bottom"
                centerLabel={t(translations.inscriptions)}
                ariaLabel={t(translations.byStatus)}
                emptyMessage={t(translations.noData)}
              />
            )}
          </SurfaceCard>

          <SurfaceCard
            title={t(translations.byLanguage)}
            description={t(translations.portfolioScope)}
            icon={Languages}
          >
            {portfolioLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="h-8 animate-shimmer rounded-[var(--radius)]" />
                ))}
              </div>
            ) : (
              <RankedBarList
                items={languageBars}
                colorBySeries
                emptyMessage={t(translations.noData)}
              />
            )}
          </SurfaceCard>
        </div>

        <SurfaceCard
          flush
          toolbar={
            <FilterBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: t(translations.searchPlaceholder),
              }}
              filters={
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
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
                    <SelectTrigger className="w-[160px]">
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
                </>
              }
              activeFilters={activeFilters}
              onClearAll={
                activeFilters.length > 0
                  ? () => {
                      setStatusFilter("all");
                      setLanguageFilter("all");
                      setSearch("");
                    }
                  : undefined
              }
            />
          }
          footer={
            inscriptions && inscriptions.length > 0 ? (
              <p className="text-sm text-muted-foreground tabular">
                {t(translations.showing)}{" "}
                {inscriptions.length}{" "}
                {inscriptions.length === 1
                  ? t(translations.inscriptionSingular)
                  : t(translations.inscriptions)}
              </p>
            ) : undefined
          }
        >
          {listBody}
        </SurfaceCard>
      </PageShell>

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

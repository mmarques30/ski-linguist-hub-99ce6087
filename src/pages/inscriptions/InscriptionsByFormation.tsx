import { useMemo, useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import {
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InscriptionsSubnav } from "@/components/inscriptions/InscriptionsSubnav";
import { InscriptionStatusMenu } from "@/components/inscriptions/InscriptionStatusMenu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterBar,
  PageHeader,
  PageShell,
  StatTile,
  StatTileGrid,
  StatusPill,
  SurfaceCard,
  TableEmpty,
} from "@/components/ui-kit";
import { useInscriptions } from "@/hooks/useInscriptions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSeasonFilter } from "@/contexts/SeasonContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { LANGUAGE_LABELS } from "@/lib/language-catalog";
import { getStatusLabel } from "@/lib/inscription-status";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import {
  displayPisteLabel,
  pistePillTone,
} from "@/lib/placement-test-engine";
import {
  formationGroupTitle,
  groupInscriptionsByFormation,
} from "@/lib/inscriptions-by-formation";

const translations = {
  title: {
    fr: "Inscriptions par formation",
    "pt-BR": "Inscrições por formação",
    en: "Enrollments by training",
  },
  subtitle: {
    fr: "Stagiaires regroupés par lieu, langue et dates de formation",
    "pt-BR": "Alunos agrupados por local, idioma e datas da formação",
    en: "Students grouped by location, language and training dates",
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
  allLanguages: {
    fr: "Toutes les langues",
    "pt-BR": "Todos os idiomas",
    en: "All languages",
  },
  status: {
    fr: "Statut",
    "pt-BR": "Status",
    en: "Status",
  },
  language: {
    fr: "Langue",
    "pt-BR": "Idioma",
    en: "Language",
  },
  formations: {
    fr: "Formations",
    "pt-BR": "Formações",
    en: "Trainings",
  },
  inscriptions: {
    fr: "Inscriptions",
    "pt-BR": "Inscrições",
    en: "Enrollments",
  },
  avgPerFormation: {
    fr: "Moyenne / formation",
    "pt-BR": "Média / formação",
    en: "Average / training",
  },
  emptyTitle: {
    fr: "Aucune inscription pour ces filtres",
    "pt-BR": "Nenhuma inscrição para estes filtros",
    en: "No enrollments for these filters",
  },
  emptyDesc: {
    fr: "Ajustez la saison, le statut ou la langue pour voir les formations.",
    "pt-BR": "Ajuste a temporada, o status ou o idioma para ver as formações.",
    en: "Adjust the season, status or language to see trainings.",
  },
  loadError: {
    fr: "Impossible de charger les inscriptions",
    "pt-BR": "Não foi possível carregar as inscrições",
    en: "Unable to load enrollments",
  },
  enrolled: {
    fr: "inscrits",
    "pt-BR": "inscritos",
    en: "enrolled",
  },
  enrolledOne: {
    fr: "inscrit",
    "pt-BR": "inscrito",
    en: "enrolled",
  },
};

export default function InscriptionsByFormation() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { language, t } = useLanguage();
  const { seasonId, seasonStart, seasonEnd, season } = useSeasonFilter();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("inscriptions");

  const { data: inscriptions, isLoading, error } = useInscriptions({
    status: statusFilter,
    language: languageFilter,
    search: search || undefined,
    seasonId,
    seasonStart,
    seasonEnd,
    // Vue groupée : on charge tout le portefeuille de saison, pas le plafond liste.
    limit: 2000,
  });

  const dateLocale = language === "pt-BR" ? ptBR : language === "en" ? enUS : fr;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  const formatPeriodLong = (start: string, end: string) => {
    try {
      const startLabel = format(new Date(start), "d MMMM yyyy", { locale: dateLocale });
      const endLabel = format(new Date(end), "d MMMM yyyy", { locale: dateLocale });
      return `${startLabel} → ${endLabel}`;
    } catch {
      return `${start} → ${end}`;
    }
  };

  const groups = useMemo(
    () => groupInscriptionsByFormation(inscriptions ?? []),
    [inscriptions]
  );

  const stats = useMemo(() => {
    const totalInscriptions = inscriptions?.length ?? 0;
    const totalFormations = groups.length;
    const average =
      totalFormations > 0 ? Math.round((totalInscriptions / totalFormations) * 10) / 10 : 0;
    return { totalInscriptions, totalFormations, average };
  }, [inscriptions, groups]);

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
      label: search,
      onRemove: () => setSearch(""),
    });
  }

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={Layers}
          tone="gold"
          meta={
            season ? <StatusPill tone="info">{season.name}</StatusPill> : undefined
          }
          tabs={<InscriptionsSubnav />}
        />

        <StatTileGrid cols={3}>
          <StatTile
            label={t(translations.formations)}
            value={stats.totalFormations}
            icon={Layers}
            tone="gold"
            loading={isLoading}
          />
          <StatTile
            label={t(translations.inscriptions)}
            value={stats.totalInscriptions}
            icon={Users}
            tone="navy"
            loading={isLoading}
          />
          <StatTile
            label={t(translations.avgPerFormation)}
            value={stats.average}
            icon={MapPin}
            tone="teal"
            loading={isLoading}
          />
        </StatTileGrid>

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
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="confirmee">Confirmée</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="terminee">Terminée</SelectItem>
                      <SelectItem value="facturee">Facturée</SelectItem>
                      <SelectItem value="annulee">Annulée</SelectItem>
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
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement…
            </div>
          ) : error ? (
            <TableEmpty
              title={t(translations.loadError)}
              description={error.message}
              icon={Layers}
            />
          ) : groups.length === 0 ? (
            <TableEmpty
              title={t(translations.emptyTitle)}
              description={t(translations.emptyDesc)}
              icon={Layers}
            />
          ) : null}
        </SurfaceCard>

        {!isLoading &&
          !error &&
          groups.map((group) => (
            <SurfaceCard
              key={group.key}
              title={formationGroupTitle(group)}
              description={
                group.datesToConfirm
                  ? `${DATES_A_PLANIFIER_LABEL} · souhaité le ${formatDate(group.startDate)}`
                  : formatPeriodLong(group.startDate, group.endDate)
              }
              actions={
                <>
                  {group.modality ? (
                    <StatusPill tone="neutral">{group.modality}</StatusPill>
                  ) : null}
                  {group.datesToConfirm ? (
                    <StatusPill tone="warning">{DATES_A_PLANIFIER_LABEL}</StatusPill>
                  ) : null}
                  <StatusPill tone="info">
                    {group.inscriptions.length}{" "}
                    {group.inscriptions.length === 1
                      ? t(translations.enrolledOne)
                      : t(translations.enrolled)}
                  </StatusPill>
                </>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {group.inscriptions.map((inscription) => (
                  <li
                    key={inscription.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-[200px] flex-1">
                      {inscription.student_id ? (
                        <Link
                          to={`/students/${inscription.student_id}`}
                          className="font-medium hover:underline"
                        >
                          {inscription.student_name || "—"}
                        </Link>
                      ) : (
                        <p className="font-medium">{inscription.student_name || "—"}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {inscription.code || "—"}
                        {inscription.ski_school_name
                          ? ` · ${inscription.ski_school_name}`
                          : ""}
                        {inscription.instructor_name
                          ? ` · ${inscription.instructor_name}`
                          : ""}
                      </p>
                    </div>

                    {inscription.entry_level ? (
                      <StatusPill
                        tone={pistePillTone(displayPisteLabel(inscription.entry_level))}
                        size="sm"
                      >
                        {displayPisteLabel(inscription.entry_level)}
                      </StatusPill>
                    ) : null}

                    <InscriptionStatusMenu
                      inscriptionId={inscription.id}
                      status={inscription.status || ""}
                      startDate={inscription.start_date}
                      readOnly={!editable}
                    />

                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={`/inscriptions/${inscription.id}`}
                        aria-label={`Ouvrir la fiche de ${inscription.student_name || inscription.code}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </SurfaceCard>
          ))}
      </PageShell>
    </MainLayout>
  );
}

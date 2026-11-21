import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
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
import { InscriptionStatusFilter } from "@/components/inscriptions/InscriptionStatusFilter";
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
  SegmentedControl,
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
import {
  FORMATION_VIEW_DEFAULT_FILTER_LABELS,
  FORMATION_VIEW_DEFAULT_FILTER_STATUSES,
  describeStatusFilter,
  isAllStatusFilter,
  isDefaultStatusFilter,
  parseStatusFilterParam,
  serializeStatusFilterParam,
  type InscriptionStatus,
} from "@/lib/inscription-status";
import { DATES_A_PLANIFIER_LABEL } from "@/lib/registration-dates";
import {
  displayPisteLabel,
  pistePillTone,
} from "@/lib/placement-test-engine";
import {
  formationGroupTitle,
  groupInscriptionsByFormation,
  type FormationViewMode,
} from "@/lib/inscriptions-by-formation";
import {
  DOCS_SENT_LABELS,
  DOCS_SENT_TONES,
  PAYMENT_SETTLEMENT_LABELS,
  PAYMENT_SETTLEMENT_TONES,
} from "@/lib/inscription-ops-visibility";

const translations = {
  title: {
    fr: "Inscriptions par formation",
    "pt-BR": "Inscrições por formação",
    en: "Enrollments by training",
  },
  subtitle: {
    fr: "Stagiaires regroupés par lieu, langue, dates — et par groupe pédagogique",
    "pt-BR": "Alunos agrupados por local, idioma, datas — e por grupo pedagógico",
    en: "Students grouped by location, language, dates — and teaching group",
  },
  searchPlaceholder: {
    fr: "Rechercher par nom, email ou code...",
    "pt-BR": "Buscar por nome, e-mail ou código...",
    en: "Search by name, email or code...",
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
  groups: {
    fr: "Groupes",
    "pt-BR": "Grupos",
    en: "Groups",
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
  avgPerGroup: {
    fr: "Moyenne / groupe",
    "pt-BR": "Média / grupo",
    en: "Average / group",
  },
  viewFormation: {
    fr: "Par formation",
    "pt-BR": "Por formação",
    en: "By training",
  },
  viewGroup: {
    fr: "Par groupe",
    "pt-BR": "Por grupo",
    en: "By group",
  },
  viewAria: {
    fr: "Mode d'affichage",
    "pt-BR": "Modo de exibição",
    en: "Display mode",
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

function parseViewMode(raw: string | null): FormationViewMode {
  return raw === "formation" ? "formation" : "groupe";
}

export default function InscriptionsByFormation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const languageFromUrl = searchParams.get("language");
  const viewFromUrl = searchParams.get("view");
  const [statusFilters, setStatusFilters] = useState<InscriptionStatus[]>(() =>
    parseStatusFilterParam(statusFromUrl, FORMATION_VIEW_DEFAULT_FILTER_STATUSES)
  );
  const [languageFilter, setLanguageFilter] = useState(
    () => languageFromUrl || "all"
  );
  const [viewMode, setViewMode] = useState<FormationViewMode>(() =>
    parseViewMode(viewFromUrl)
  );
  const [search, setSearch] = useState("");
  const { language, t } = useLanguage();
  const { seasonId, seasonStart, seasonEnd, season } = useSeasonFilter();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("inscriptions");

  const applyStatusFilters = (next: InscriptionStatus[]) => {
    setStatusFilters(next);
    const params = new URLSearchParams(searchParams);
    const serialized = serializeStatusFilterParam(
      next,
      FORMATION_VIEW_DEFAULT_FILTER_STATUSES
    );
    if (serialized == null) params.delete("status");
    else params.set("status", serialized);
    setSearchParams(params, { replace: true });
  };

  const applyViewMode = (next: FormationViewMode) => {
    setViewMode(next);
    const params = new URLSearchParams(searchParams);
    // Défaut = groupe : on n'écrit `view` que pour « formation ».
    if (next === "groupe") params.delete("view");
    else params.set("view", next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    setStatusFilters(
      parseStatusFilterParam(statusFromUrl, FORMATION_VIEW_DEFAULT_FILTER_STATUSES)
    );
  }, [statusFromUrl]);

  useEffect(() => {
    if (languageFromUrl) setLanguageFilter(languageFromUrl);
  }, [languageFromUrl]);

  useEffect(() => {
    setViewMode(parseViewMode(viewFromUrl));
  }, [viewFromUrl]);

  const queryStatuses = isAllStatusFilter(statusFilters)
    ? undefined
    : statusFilters;

  const { data: inscriptions, isLoading, error } = useInscriptions({
    statuses: queryStatuses,
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
    () => groupInscriptionsByFormation(inscriptions ?? [], viewMode),
    [inscriptions, viewMode]
  );

  const stats = useMemo(() => {
    const totalInscriptions = inscriptions?.length ?? 0;
    const totalFormations = groups.length;
    const average =
      totalFormations > 0 ? Math.round((totalInscriptions / totalFormations) * 10) / 10 : 0;
    return { totalInscriptions, totalFormations, average };
  }, [inscriptions, groups]);

  const activeFilters: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (!isDefaultStatusFilter(statusFilters, FORMATION_VIEW_DEFAULT_FILTER_STATUSES)) {
    activeFilters.push({
      key: "status",
      label: `${t(translations.status)} : ${describeStatusFilter(statusFilters, language, {
        defaultStatuses: FORMATION_VIEW_DEFAULT_FILTER_STATUSES,
        defaultLabel: FORMATION_VIEW_DEFAULT_FILTER_LABELS,
      })}`,
      onRemove: () => applyStatusFilters([...FORMATION_VIEW_DEFAULT_FILTER_STATUSES]),
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
            label={
              viewMode === "groupe"
                ? t(translations.groups)
                : t(translations.formations)
            }
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
            label={
              viewMode === "groupe"
                ? t(translations.avgPerGroup)
                : t(translations.avgPerFormation)
            }
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
                  <SegmentedControl
                    ariaLabel={t(translations.viewAria)}
                    size="sm"
                    value={viewMode}
                    onChange={applyViewMode}
                    options={[
                      { value: "groupe", label: t(translations.viewGroup) },
                      { value: "formation", label: t(translations.viewFormation) },
                    ]}
                  />
                  <InscriptionStatusFilter
                    value={statusFilters}
                    onChange={applyStatusFilters}
                    language={language}
                    defaultStatuses={FORMATION_VIEW_DEFAULT_FILTER_STATUSES}
                    defaultPresetLabel={FORMATION_VIEW_DEFAULT_FILTER_LABELS}
                  />
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
                      applyStatusFilters([...FORMATION_VIEW_DEFAULT_FILTER_STATUSES]);
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
                {group.inscriptions.map((inscription) => {
                  const docsStatus = inscription.docs_sent_status ?? "a_envoyer";
                  const payStatus = inscription.payment_settlement ?? "aucun";
                  return (
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

                    <StatusPill tone={DOCS_SENT_TONES[docsStatus]} size="sm" dot>
                      {DOCS_SENT_LABELS[docsStatus]}
                    </StatusPill>
                    <StatusPill
                      tone={PAYMENT_SETTLEMENT_TONES[payStatus]}
                      size="sm"
                      dot
                    >
                      {PAYMENT_SETTLEMENT_LABELS[payStatus]}
                    </StatusPill>

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
                  );
                })}
              </ul>
            </SurfaceCard>
          ))}
      </PageShell>
    </MainLayout>
  );
}

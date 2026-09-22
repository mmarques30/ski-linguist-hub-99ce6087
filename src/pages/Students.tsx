import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Search,
  Eye,
  Mail,
  Phone,
  Grid,
  List,
  Users,
  Building2,
  Plus,
  Pencil,
  MapPin,
  KeyRound,
} from "lucide-react";
import { useStudents, useStudentStats } from "@/hooks/useStudents";
import { format } from "date-fns";
import { fr, enUS, ptBR } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { PortalInvitesBulkCard } from "@/components/students/PortalInvitesBulkCard";
import {
  studentEmailForSend,
  studentEmailLabel,
} from "@/lib/email-guards";
import {
  CardGrid,
  CardList,
  CardListItem,
  FilterBar,
  IdentityCell,
  PageHeader,
  PageShell,
  RankedBarList,
  SegmentedControl,
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
  noSearchResults: {
    fr: "Aucun résultat pour cette recherche",
    "pt-BR": "Nenhum resultado para esta pesquisa",
    en: "No results for this search"
  },
  noSearchResultsDescription: {
    fr: "Essayez un autre nom, e-mail ou entreprise.",
    "pt-BR": "Tente outro nome, e-mail ou empresa.",
    en: "Try a different name, email, or company."
  },
  clearSearch: {
    fr: "Effacer la recherche",
    "pt-BR": "Limpar pesquisa",
    en: "Clear search"
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
  studentSingular: {
    fr: "stagiaire",
    "pt-BR": "estagiário",
    en: "student",
  },
  students: {
    fr: "stagiaires",
    "pt-BR": "estagiários",
    en: "students"
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
  },
  listView: {
    fr: "Vue liste",
    "pt-BR": "Visão em lista",
    en: "List view"
  },
  gridView: {
    fr: "Vue grille",
    "pt-BR": "Visão em grade",
    en: "Grid view"
  },
  addStudent: {
    fr: "Ajouter un stagiaire",
    "pt-BR": "Adicionar um estagiário",
    en: "Add a student"
  },
  // Bandeau de synthèse — libellés ajoutés par la densification visuelle.
  tileTotal: {
    fr: "Stagiaires en base",
    "pt-BR": "Estagiários na base",
    en: "Students on file",
  },
  tilePortal: {
    fr: "Avec compte portail",
    "pt-BR": "Com conta no portal",
    en: "With a portal account",
  },
  tileCompany: {
    fr: "Avec entreprise ou ESF",
    "pt-BR": "Com empresa ou ESF",
    en: "With a company or ski school",
  },
  tileCities: {
    fr: "Villes distinctes",
    "pt-BR": "Cidades distintas",
    en: "Distinct cities",
  },
  topCities: {
    fr: "Villes les plus représentées",
    "pt-BR": "Cidades mais representadas",
    en: "Most represented cities",
  },
  topCompanies: {
    fr: "Entreprises et écoles de ski",
    "pt-BR": "Empresas e escolas de esqui",
    en: "Companies and ski schools",
  },
  scopeDisplayed: {
    fr: "Calculé sur les stagiaires affichés, pas sur toute la base.",
    "pt-BR": "Calculado sobre os estagiários exibidos, não sobre toda a base.",
    en: "Computed over the students shown, not the whole database.",
  },
  noBreakdown: {
    fr: "Aucune donnée renseignée",
    "pt-BR": "Nenhum dado informado",
    en: "No data available",
  },
};

export default function Students() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { language, t } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("students");

  // Les répartitions du bandeau pointent ici avec ?q=… (entreprise cliquée).
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const hasSearch = search.trim().length > 0;

  const { data: students, isLoading, error } = useStudents({
    search: hasSearch ? search : undefined,
  });

  /**
   * Compteur global de la base — `useStudentStats` fait un `count: exact`
   * en tête, il ne dépend donc pas de la page de 100 lignes chargée ici.
   */
  const { data: studentStats, isLoading: statsLoading } = useStudentStats();

  /**
   * Répartitions dérivées des seules lignes déjà chargées (100 au maximum) :
   * aucune requête supplémentaire, et chaque tuile dit explicitement qu'elle
   * porte sur les stagiaires affichés.
   */
  const summary = useMemo(() => {
    const rows = students ?? [];
    const cityCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();
    let withPortal = 0;
    let withCompany = 0;

    for (const student of rows) {
      if (student.auth_user_id) withPortal += 1;
      const company = (student.company ?? "").trim();
      if (company) {
        withCompany += 1;
        companyCounts.set(company, (companyCounts.get(company) ?? 0) + 1);
      }
      const city = (student.city ?? "").trim();
      if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
    }

    const rank = (counts: Map<string, number>) =>
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
        .slice(0, 6);

    return {
      displayed: rows.length,
      withPortal,
      withCompany,
      distinctCities: cityCounts.size,
      topCities: rank(cityCounts),
      topCompanies: rank(companyCounts),
    };
  }, [students]);

  /** « sur les N affichés » — jamais un total qui aurait l'air global. */
  const ofDisplayed = (count: number) =>
    t({
      fr: `sur les ${count} affichés`,
      "pt-BR": `entre os ${count} exibidos`,
      en: `of the ${count} shown`,
    });

  /** Part d'un sous-ensemble réel des lignes affichées. */
  const shareOfDisplayed = (count: number) =>
    summary.displayed > 0 ? ` · ${Math.round((count / summary.displayed) * 100)}%` : "";

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

  /** Actions d'une ligne : profil, édition, e-mail, téléphone. */
  const rowActions = (student: any, align: "start" | "end") => (
    <div
      className={`flex items-center gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(`/students/${student.id}`)}
        aria-label={t(translations.viewProfile)}
        title={t(translations.viewProfile)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {editable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleEditStudent(student)}
          aria-label={t(translations.edit)}
          title={t(translations.edit)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {studentEmailForSend(student.email) && (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={`mailto:${student.email}`} aria-label="Envoyer un e-mail">
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      )}
      {student.phone && (
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <a href={`tel:${student.phone}`} aria-label="Appeler">
            <Phone className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );

  const companyPill = (company: string | null) =>
    company ? (
      <StatusPill tone="neutral" size="sm" icon={Building2}>
        {company}
      </StatusPill>
    ) : (
      "-"
    );

  const emailCell = (student: any) =>
    studentEmailForSend(student.email) ? (
      <span className="truncate">{student.email}</span>
    ) : (
      <span className="truncate italic text-muted-foreground">
        {studentEmailLabel(student.email)}
      </span>
    );

  /** Corps de la carte : squelette, erreur, état vide ou données. */
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeleton rows={6} cols={6} />;
    }

    if (error) {
      return (
        <TableEmpty
          icon={Users}
          title={t(translations.loadingError)}
          description={error.message}
        />
      );
    }

    if (!students || students.length === 0) {
      return hasSearch ? (
        <TableEmpty
          icon={Search}
          title={t(translations.noSearchResults)}
          description={t(translations.noSearchResultsDescription)}
          action={
            <Button variant="outline" onClick={() => setSearch("")}>
              {t(translations.clearSearch)}
            </Button>
          }
        />
      ) : (
        <TableEmpty
          icon={Users}
          title={t(translations.noStudents)}
          description={t(translations.noStudentsDescription)}
          action={
            editable ? (
              <Button onClick={handleCreateStudent}>
                <Plus className="mr-2 h-4 w-4" />
                {t(translations.addStudent)}
              </Button>
            ) : undefined
          }
        />
      );
    }

    if (viewMode === "list") {
      return (
        <>
          <TableFrame className="hidden md:block">
            <table className="w-full">
              <thead>
                <TableHeadRow>
                  <TableHeadCell>{t(translations.student)}</TableHeadCell>
                  <TableHeadCell className="hidden lg:table-cell">
                    {t(translations.email)}
                  </TableHeadCell>
                  <TableHeadCell className="hidden lg:table-cell">
                    {t(translations.phone)}
                  </TableHeadCell>
                  <TableHeadCell className="hidden xl:table-cell">
                    {t(translations.city)}
                  </TableHeadCell>
                  <TableHeadCell>{t(translations.company)}</TableHeadCell>
                  <TableHeadCell className="hidden xl:table-cell">
                    {t(translations.registration)}
                  </TableHeadCell>
                  <TableHeadCell align="right">{t(translations.actions)}</TableHeadCell>
                </TableHeadRow>
              </thead>
              <tbody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <IdentityCell
                        name={`${student.first_name} ${student.last_name}`}
                        secondary={student.city || undefined}
                        to={`/students/${student.id}`}
                      />
                    </TableCell>
                    <TableCell hideBelow="lg" className="max-w-[240px] truncate">
                      {emailCell(student)}
                    </TableCell>
                    <TableCell hideBelow="lg">{student.phone || "-"}</TableCell>
                    <TableCell hideBelow="xl">{student.city || "-"}</TableCell>
                    <TableCell>{companyPill(student.company)}</TableCell>
                    <TableCell hideBelow="xl" className="tabular">
                      {formatDate(student.created_at)}
                    </TableCell>
                    <TableCell align="right">{rowActions(student, "end")}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </TableFrame>

          {/* Téléphone : une carte par stagiaire plutôt qu'un tableau à 7 colonnes. */}
          <CardList className="md:hidden">
            {students.map((student) => (
              <CardListItem
                key={student.id}
                title={
                  <Link to={`/students/${student.id}`} className="hover:underline">
                    {student.first_name} {student.last_name}
                  </Link>
                }
                subtitle={emailCell(student)}
                meta={student.company ? companyPill(student.company) : undefined}
                fields={[
                  { label: t(translations.phone), value: student.phone || "-" },
                  { label: t(translations.city), value: student.city || "-" },
                  {
                    label: t(translations.registration),
                    value: formatDate(student.created_at),
                  },
                ]}
                actions={rowActions(student, "start")}
              />
            ))}
          </CardList>
        </>
      );
    }

    return (
      <CardGrid cols={3}>
        {students.map((student) => (
          <SurfaceCard key={student.id} interactive className="h-full">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-primary/12 text-lg font-semibold text-[hsl(var(--tint-gold-fg))]">
                  {getInitials(student.first_name, student.last_name)}
                </span>
                <div className="min-w-0">
                  <Link
                    to={`/students/${student.id}`}
                    className="block truncate font-semibold hover:underline"
                  >
                    {student.first_name} {student.last_name}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {student.city || t(translations.cityNotProvided)}
                  </p>
                </div>
              </div>

              {student.company && companyPill(student.company)}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{t(translations.email)}</dt>
                  <dd
                    className={`truncate font-medium ${
                      studentEmailForSend(student.email) ? "" : "italic text-muted-foreground"
                    }`}
                  >
                    {studentEmailLabel(student.email)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{t(translations.phone)}</dt>
                  <dd className="truncate font-medium">{student.phone || "-"}</dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t(translations.viewProfile)}
                </Button>
                {editable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditStudent(student)}
                    aria-label={t(translations.edit)}
                    title={t(translations.edit)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {studentEmailForSend(student.email) && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`mailto:${student.email}`} aria-label="Envoyer un e-mail">
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {student.phone && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`tel:${student.phone}`} aria-label="Appeler">
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </CardGrid>
    );
  };

  const total = students?.length ?? 0;

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={Users}
          tone="gold"
          actions={
            editable ? (
              <Button size="sm" onClick={handleCreateStudent}>
                <Plus className="mr-2 h-4 w-4" />
                {t(translations.newStudent)}
              </Button>
            ) : undefined
          }
        />

        {/*
          Bandeau de synthèse. Seul le total vient d'un comptage global
          (`useStudentStats`) ; les trois autres tuiles et les deux
          classements portent sur les lignes affichées et le disent.
        */}
        <StatTileGrid cols={4}>
          <StatTile
            label={t(translations.tileTotal)}
            value={studentStats?.total ?? 0}
            hint={`${summary.displayed} ${t({
              fr: "affichés ici",
              "pt-BR": "exibidos aqui",
              en: "shown here",
            })}`}
            icon={Users}
            tone="gold"
            loading={statsLoading}
            onClick={hasSearch ? () => setSearch("") : undefined}
          />
          <StatTile
            label={t(translations.tilePortal)}
            value={summary.withPortal}
            hint={`${ofDisplayed(summary.displayed)}${shareOfDisplayed(summary.withPortal)}`}
            icon={KeyRound}
            tone="blue"
            loading={isLoading}
          />
          <StatTile
            label={t(translations.tileCompany)}
            value={summary.withCompany}
            hint={`${ofDisplayed(summary.displayed)}${shareOfDisplayed(summary.withCompany)}`}
            icon={Building2}
            tone="teal"
            loading={isLoading}
          />
          <StatTile
            label={t(translations.tileCities)}
            value={summary.distinctCities}
            hint={ofDisplayed(summary.displayed)}
            icon={MapPin}
            tone="purple"
            loading={isLoading}
          />
        </StatTileGrid>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <SurfaceCard
            title={t(translations.topCities)}
            description={t(translations.scopeDisplayed)}
            icon={MapPin}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="h-8 animate-shimmer rounded-[var(--radius)]" />
                ))}
              </div>
            ) : (
              <RankedBarList
                colorBySeries
                emptyMessage={t(translations.noBreakdown)}
                items={summary.topCities.map(([city, count]) => ({
                  key: city,
                  label: city,
                  value: count,
                }))}
              />
            )}
          </SurfaceCard>

          <SurfaceCard
            title={t(translations.topCompanies)}
            description={t(translations.scopeDisplayed)}
            icon={Building2}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="h-8 animate-shimmer rounded-[var(--radius)]" />
                ))}
              </div>
            ) : (
              <RankedBarList
                colorBySeries
                emptyMessage={t(translations.noBreakdown)}
                items={summary.topCompanies.map(([company, count]) => ({
                  key: company,
                  label: company,
                  value: count,
                  // La recherche porte déjà sur l'entreprise : la ligne ouvre
                  // la liste filtrée sur ce nom.
                  href: `/students?q=${encodeURIComponent(company)}`,
                }))}
              />
            )}
          </SurfaceCard>
        </div>

        {editable && <PortalInvitesBulkCard />}

        <SurfaceCard
          flush={viewMode === "list"}
          toolbar={
            <FilterBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: t(translations.searchPlaceholder),
                ariaLabel: t(translations.searchPlaceholder),
              }}
              actions={
                <SegmentedControl<"grid" | "list">
                  value={viewMode}
                  onChange={setViewMode}
                  size="sm"
                  ariaLabel={t(translations.title)}
                  options={[
                    {
                      value: "list",
                      icon: List,
                      label: <span className="sr-only">{t(translations.listView)}</span>,
                    },
                    {
                      value: "grid",
                      icon: Grid,
                      label: <span className="sr-only">{t(translations.gridView)}</span>,
                    },
                  ]}
                />
              }
              activeFilters={
                hasSearch
                  ? [
                      {
                        key: "search",
                        label: search,
                        onRemove: () => setSearch(""),
                      },
                    ]
                  : undefined
              }
              onClearAll={hasSearch ? () => setSearch("") : undefined}
            />
          }
          footer={
            total > 0 ? (
              <p className="text-sm text-muted-foreground tabular">
                {t(translations.showing)} {total}{" "}
                {total === 1 ? t(translations.studentSingular) : t(translations.students)}
              </p>
            ) : undefined
          }
        >
          {renderBody()}
        </SurfaceCard>
      </PageShell>

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
      />
    </MainLayout>
  );
}

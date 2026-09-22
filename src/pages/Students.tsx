import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Search, Eye, Mail, Phone, Grid, List, Users, Building2, Plus, Pencil } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
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
  SegmentedControl,
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
  }
};

export default function Students() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { language, t } = useLanguage();
  const { canEdit } = useUserPermissions();
  const editable = canEdit("students");

  const hasSearch = search.trim().length > 0;

  const { data: students, isLoading, error } = useStudents({
    search: hasSearch ? search : undefined,
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

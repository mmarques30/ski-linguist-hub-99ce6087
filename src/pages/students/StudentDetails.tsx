import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
  User,
  GraduationCap,
  Languages,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useStudentDetails } from "@/hooks/useStudentDetails";
import { StudentPortalAccessCard } from "@/components/students/StudentPortalAccessCard";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  studentEmailForSend,
  studentEmailLabel,
} from "@/lib/email-guards";
import { getStatusLabel } from "@/lib/inscription-status";
import {
  CardList,
  CardListItem,
  DefinitionList,
  MeterRow,
  PageHeader,
  PageShell,
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
  toneForStatus,
} from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type HistoryTab = "all" | "completed" | "certifications";

/** Teinte CECRL : A (découverte), B (intermédiaire), C (avancé). */
function toneForLevel(level: string | null | undefined): PillTone {
  if (!level) return "neutral";
  if (level.startsWith("A")) return "accent";
  if (level.startsWith("B")) return "info";
  if (level.startsWith("C")) return "success";
  return "neutral";
}

function getLevelProgress(level: string | null | undefined) {
  const levelMap: Record<string, number> = {
    A1: 16.67,
    A2: 33.33,
    B1: 50,
    B2: 66.67,
    C1: 83.33,
    C2: 100,
  };
  return levelMap[level || ""] || 0;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
}

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, error } = useStudentDetails(id);
  const { canEdit } = useUserPermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>("all");

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const backLink = (
    <Button variant="ghost" size="sm" className="-ml-2" asChild>
      <Link to="/students">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux stagiaires
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <PageHeader back={backLink} title="Stagiaire" icon={User} tone="gold" />
          <StatTileGrid cols={4}>
            {[0, 1, 2, 3].map((index) => (
              <StatTile key={index} label="" value="" loading />
            ))}
          </StatTileGrid>
          <SurfaceCard flush>
            <TableSkeleton rows={5} cols={5} />
          </SurfaceCard>
        </PageShell>
      </MainLayout>
    );
  }

  if (error || !student) {
    return (
      <MainLayout>
        <PageShell>
          <SurfaceCard>
            <TableEmpty
              icon={User}
              title="Stagiaire non trouvé"
              description={
                error?.message || "Le stagiaire demandé n'existe pas ou a été supprimé."
              }
              action={
                <Button variant="outline" onClick={() => navigate("/students")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux stagiaires
                </Button>
              }
            />
          </SurfaceCard>
        </PageShell>
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

  const completedInscriptions = student.inscriptions.filter(
    (i) => i.status === "terminee" || i.status === "facturee"
  );
  const certifiedInscriptions = student.inscriptions.filter(
    (i) => i.certification_result && i.certification_result !== "N/A"
  );

  const visibleInscriptions =
    historyTab === "completed"
      ? completedInscriptions
      : historyTab === "certifications"
        ? certifiedInscriptions
        : student.inscriptions;

  const contactItems: Array<{ label: ReactNode; value: ReactNode }> = [
    {
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Email
        </span>
      ),
      value: (
        <span className={studentEmailForSend(student.email) ? "" : "italic text-muted-foreground"}>
          {studentEmailLabel(student.email)}
        </span>
      ),
    },
  ];

  if (student.phone) {
    contactItems.push({
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          Téléphone
        </span>
      ),
      value: student.phone,
    });
  }

  if (student.city || student.street_address) {
    contactItems.push({
      label: (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Adresse
        </span>
      ),
      value:
        [student.street_address, student.postal_code, student.city].filter(Boolean).join(", ") ||
        "-",
    });
  }

  if (student.company) {
    contactItems.push({
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Entreprise
        </span>
      ),
      value: student.company,
    });
  }

  contactItems.push({
    label: (
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        Client depuis
      </span>
    ),
    value: formatDate(student.created_at),
  });

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          back={backLink}
          title={
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-primary/12 text-lg font-bold text-[hsl(var(--tint-gold-fg))]">
                {getInitials(student.first_name, student.last_name)}
              </span>
              <span className="min-w-0 break-words">
                {student.first_name} {student.last_name}
              </span>
            </span>
          }
          meta={
            <>
              <StatusPill tone="neutral" icon={Mail}>
                <span className={studentEmailForSend(student.email) ? "" : "italic"}>
                  {studentEmailLabel(student.email)}
                </span>
              </StatusPill>
              {student.phone && (
                <StatusPill tone="neutral" icon={Phone}>
                  {student.phone}
                </StatusPill>
              )}
              {student.company && (
                <StatusPill tone="info" icon={Building2}>
                  {student.company}
                </StatusPill>
              )}
            </>
          }
          actions={
            <>
              {canEdit("students") && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}
              {studentEmailForSend(student.email) ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${student.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer un email
                  </a>
                </Button>
              ) : null}
            </>
          }
        />

        <StudentPortalAccessCard
          studentId={student.id}
          studentName={`${student.first_name} ${student.last_name}`}
          email={student.email}
          authUserId={student.auth_user_id}
        />

        {/* Compteurs — chacun ouvre l'onglet correspondant de l'historique. */}
        <StatTileGrid cols={4}>
          <StatTile
            label="Total des inscriptions"
            value={student.stats.totalInscriptions}
            hint={`${student.stats.completedCourses} formations terminées`}
            icon={BookOpen}
            tone="gold"
            onClick={() => setHistoryTab("all")}
          />
          <StatTile
            label="Heures de formation"
            value={`${student.stats.totalHours}h`}
            hint="Total cumulé"
            icon={Clock}
            tone="blue"
          />
          <StatTile
            label="Certifications"
            value={student.stats.certifications}
            hint={
              bestCertification
                ? `Meilleur : ${bestCertification.certification_result}`
                : "Aucune certification"
            }
            icon={Award}
            tone="teal"
            onClick={() => setHistoryTab("certifications")}
          />
          <StatTile
            label="Langues"
            value={student.stats.languages.length}
            hint={`${student.stats.languages.slice(0, 2).join(", ")}${
              student.stats.languages.length > 2 ? "..." : ""
            }`}
            icon={Languages}
            tone="purple"
          />
        </StatTileGrid>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          {/* Colonne gauche — identité du stagiaire */}
          <div className="min-w-0 space-y-4 lg:space-y-5">
            <SurfaceCard title="Informations de contact" icon={User}>
              <DefinitionList items={contactItems} />
            </SurfaceCard>

            <SurfaceCard title="Progression par langue" icon={Languages}>
              {student.stats.languages.length > 0 ? (
                <div className="space-y-5">
                  {student.stats.languages.map((language) => {
                    const langInscriptions = student.inscriptions.filter(
                      (i) => i.language === language
                    );
                    const lastCert = langInscriptions.find(
                      (i) => i.certification_result && i.certification_result !== "N/A"
                    );
                    const level = lastCert?.certification_result || langInscriptions[0]?.entry_level;

                    return (
                      <div key={language} className="space-y-1.5">
                        <MeterRow
                          label={language}
                          value={getLevelProgress(level)}
                          display={
                            level ? (
                              <StatusPill tone={toneForLevel(level)} size="sm">
                                {level}
                              </StatusPill>
                            ) : (
                              <></>
                            )
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {langInscriptions.length} inscription(s)
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune langue enregistrée</p>
              )}
            </SurfaceCard>
          </div>

          {/* Colonne droite — historique des inscriptions */}
          <div className="min-w-0 lg:col-span-2">
            <SurfaceCard
              title="Historique des inscriptions"
              icon={GraduationCap}
              flush
              toolbar={
                <SegmentedControl<HistoryTab>
                  value={historyTab}
                  onChange={setHistoryTab}
                  size="sm"
                  ariaLabel="Historique des inscriptions"
                  options={[
                    {
                      value: "all",
                      label: "Toutes",
                      count: student.inscriptions.length,
                    },
                    {
                      value: "completed",
                      label: "Terminées",
                      count: student.stats.completedCourses,
                    },
                    {
                      value: "certifications",
                      label: "Avec certification",
                      count: student.stats.certifications,
                    },
                  ]}
                />
              }
            >
              <InscriptionTable inscriptions={visibleInscriptions} />
            </SurfaceCard>
          </div>
        </div>
      </PageShell>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={{
          id: student.id,
          civility: student.civility,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          phone: student.phone,
          company: student.company,
          street_address: student.street_address,
          postal_code: student.postal_code,
          city: student.city,
        }}
      />
    </MainLayout>
  );
}

function InscriptionTable({ inscriptions }: { inscriptions: any[] }) {
  const navigate = useNavigate();

  if (inscriptions.length === 0) {
    return <TableEmpty icon={BookOpen} title="Aucune inscription trouvée" />;
  }

  const periodLabel = (inscription: any) =>
    `${formatDate(inscription.start_date)} - ${formatDate(inscription.end_date)}`;

  const certificationCell = (inscription: any) =>
    inscription.certification_result && inscription.certification_result !== "N/A" ? (
      <StatusPill tone={toneForLevel(inscription.certification_result)} size="sm">
        {inscription.certification_result}
      </StatusPill>
    ) : (
      <span className="text-muted-foreground">-</span>
    );

  const statusPill = (inscription: any) => (
    <StatusPill tone={toneForStatus(inscription.status)} size="sm">
      {inscription.status ? getStatusLabel(inscription.status, "fr") : "-"}
    </StatusPill>
  );

  return (
    <>
      <TableFrame className="hidden md:block">
        <table className="w-full">
          <thead>
            <TableHeadRow>
              <TableHeadCell>Code</TableHeadCell>
              <TableHeadCell>Langue</TableHeadCell>
              <TableHeadCell className="hidden lg:table-cell">Modalité</TableHeadCell>
              <TableHeadCell className="hidden lg:table-cell">Période</TableHeadCell>
              <TableHeadCell className="hidden xl:table-cell">Durée</TableHeadCell>
              <TableHeadCell>Certification</TableHeadCell>
              <TableHeadCell>Statut</TableHeadCell>
            </TableHeadRow>
          </thead>
          <tbody>
            {inscriptions.map((inscription) => (
              <TableRow
                key={inscription.id}
                onClick={() => navigate(`/inscriptions/${inscription.id}`)}
              >
                <TableCell className="font-medium">
                  <Link
                    to={`/inscriptions/${inscription.id}`}
                    className="text-[hsl(var(--tint-blue-fg))] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {inscription.code || "-"}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusPill tone="neutral" size="sm">
                    {inscription.language}
                  </StatusPill>
                </TableCell>
                <TableCell hideBelow="lg" className="text-muted-foreground">
                  {inscription.modality || "-"}
                </TableCell>
                <TableCell hideBelow="lg" className="tabular">
                  {periodLabel(inscription)}
                </TableCell>
                <TableCell hideBelow="xl" className="tabular">
                  {inscription.duration_hours ? `${inscription.duration_hours}h` : "-"}
                </TableCell>
                <TableCell>{certificationCell(inscription)}</TableCell>
                <TableCell>{statusPill(inscription)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </TableFrame>

      {/* Téléphone : une carte par inscription. */}
      <CardList className="md:hidden">
        {inscriptions.map((inscription) => (
          <CardListItem
            key={inscription.id}
            to={`/inscriptions/${inscription.id}`}
            title={inscription.code || "-"}
            subtitle={inscription.language}
            meta={statusPill(inscription)}
            fields={[
              { label: "Modalité", value: inscription.modality || "-" },
              { label: "Période", value: periodLabel(inscription) },
              {
                label: "Durée",
                value: inscription.duration_hours ? `${inscription.duration_hours}h` : "-",
              },
              { label: "Certification", value: certificationCell(inscription) },
            ]}
          />
        ))}
      </CardList>
    </>
  );
}

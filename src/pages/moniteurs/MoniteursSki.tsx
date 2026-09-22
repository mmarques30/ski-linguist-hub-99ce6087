import { useState } from "react";
import { useTabParam } from "@/hooks/useTabParam";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Plus, Calendar, MapPin, Users, Mail, Send,
  Building2, Globe, Lock, Upload, Snowflake, School,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  useCourseIntakes, useSendIntakeOutreach, CourseIntake, INTAKE_STATUSES,
} from "@/hooks/useCourseIntakes";
import { useSkiMonitors, useSkiMonitorStats, SkiMonitor } from "@/hooks/useSkiMonitors";
import { CourseIntakeFormDialog } from "@/components/moniteurs/CourseIntakeFormDialog";
import { SkiMonitorFormDialog } from "@/components/moniteurs/SkiMonitorFormDialog";
import { SkiMonitorImportDialog } from "@/components/moniteurs/SkiMonitorImportDialog";
import { SkiSchoolMatchingCard } from "@/components/moniteurs/SkiSchoolMatchingCard";
import {
  CardGrid,
  CardList,
  CardListItem,
  FilterBar,
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
  TablePagination,
  TableRow,
  TableSkeleton,
  type PillTone,
} from "@/components/ui-kit";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MESSAGE_GEL_PROSPECTION,
  MESSAGE_GEL_REACTIVATION,
  PROSPECTION_MONITEURS_GELEE,
} from "@/lib/prospection-gel";

/** Teinte de chaque statut de date — le libellé reste celui d'`INTAKE_STATUSES`. */
const INTAKE_STATUS_TONES: Record<string, PillTone> = {
  brouillon: "neutral",
  confirme: "info",
  ouvert: "success",
  complet: "warning",
  annule: "danger",
};

type MoniteursTab = "dates" | "ecoles" | "base";

function IntakeCard({
  intake,
  onEdit,
  onSend,
  sending,
}: {
  intake: CourseIntake;
  onEdit: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const statusMeta = INTAKE_STATUSES.find((s) => s.key === intake.status);

  return (
    <SurfaceCard
      interactive
      title={`${intake.language} — ${intake.location}`}
      description={
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="tabular">
            {format(new Date(intake.start_date), "dd MMM yyyy", { locale: fr })}
            {" → "}
            {format(new Date(intake.end_date), "dd MMM yyyy", { locale: fr })}
          </span>
        </span>
      }
      actions={
        <StatusPill tone={INTAKE_STATUS_TONES[intake.status] ?? "neutral"} dot size="sm">
          {statusMeta?.label}
        </StatusPill>
      }
      bodyClassName="space-y-3"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{intake.partner?.name || "—"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {intake.open_to_other_schools ? (
          <StatusPill tone="info" size="sm" icon={Globe}>
            Toutes écoles
          </StatusPill>
        ) : (
          <StatusPill tone="neutral" size="sm" icon={Lock}>
            École hôte uniquement
          </StatusPill>
        )}
        {(intake.enrollment_count ?? 0) > 0 && (
          <StatusPill tone="purple" size="sm">
            {intake.enrollment_count} inscrit(s)
          </StatusPill>
        )}
        {intake.outreach_sent_at && (
          <StatusPill tone="success" size="sm" icon={Mail}>
            Envoyé {format(new Date(intake.outreach_sent_at), "dd/MM/yy", { locale: fr })}
          </StatusPill>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onEdit}>Modifier</Button>
        {["confirme", "ouvert"].includes(intake.status) &&
          (PROSPECTION_MONITEURS_GELEE ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Snowflake className="h-3.5 w-3.5" />
              Envoi gelé
            </span>
          ) : (
            <Button size="sm" onClick={onSend} disabled={sending}>
              <Send className="mr-1 h-3.5 w-3.5" />
              {intake.outreach_sent_at ? "Renvoyer" : "Informer les moniteurs"}
            </Button>
          ))}
      </div>
    </SurfaceCard>
  );
}

export default function MoniteursSki() {
  const [moniteursTab, setMoniteursTab] = useTabParam(["dates", "ecoles", "base"] as const);
  const [searchMonitors, setSearchMonitors] = useState("");
  const [monitorPage, setMonitorPage] = useState(1);
  const monitorPageSize = 50;
  const [monitorFormOpen, setMonitorFormOpen] = useState(false);
  const [editMonitor, setEditMonitor] = useState<SkiMonitor | null>(null);
  const [intakeFormOpen, setIntakeFormOpen] = useState(false);
  const [editIntake, setEditIntake] = useState<CourseIntake | null>(null);
  const [sendTarget, setSendTarget] = useState<CourseIntake | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: intakes = [], isLoading: intakesLoading } = useCourseIntakes();
  const { data: monitorsResult, isLoading: monitorsLoading } = useSkiMonitors({
    search: searchMonitors || undefined,
    page: monitorPage,
    pageSize: monitorPageSize,
  });
  const monitors = monitorsResult?.rows ?? [];
  const monitorTotal = monitorsResult?.total ?? 0;
  const monitorTotalPages = Math.max(1, Math.ceil(monitorTotal / monitorPageSize));
  const { data: stats, isLoading: statsLoading } = useSkiMonitorStats();
  const sendOutreach = useSendIntakeOutreach();

  const scheduledIntakes = intakes.filter((i) => !["annule", "brouillon"].includes(i.status));

  const handleSend = async (dryRun = false) => {
    if (!sendTarget) return;
    try {
      const result = await sendOutreach.mutateAsync({ intakeId: sendTarget.id, dryRun });
      toast.success(result.summary || "Envoi effectué");
      setSendTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'envoi");
    }
  };

  const openMonitor = (monitor: SkiMonitor) => {
    setEditMonitor(monitor);
    setMonitorFormOpen(true);
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Moniteurs de ski"
          description="Base de contacts et dates de formation fermées avec les écoles de ski"
          icon={Snowflake}
          tone="blue"
          meta={
            PROSPECTION_MONITEURS_GELEE ? (
              <StatusPill tone="info" icon={Snowflake}>
                Prospection gelée
              </StatusPill>
            ) : undefined
          }
          actions={
            <>
              {moniteursTab === "dates" && (
                <Button onClick={() => { setEditIntake(null); setIntakeFormOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Nouvelle date
                </Button>
              )}
              {moniteursTab === "base" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setImportOpen(true)}
                    disabled={PROSPECTION_MONITEURS_GELEE}
                    title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Importer CSV
                  </Button>
                  <Button
                    onClick={() => { setEditMonitor(null); setMonitorFormOpen(true); }}
                    disabled={PROSPECTION_MONITEURS_GELEE}
                    title={PROSPECTION_MONITEURS_GELEE ? MESSAGE_GEL_PROSPECTION : undefined}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un moniteur
                  </Button>
                </>
              )}
            </>
          }
          tabs={
            <SegmentedControl<MoniteursTab>
              value={moniteursTab}
              onChange={setMoniteursTab}
              ariaLabel="Sections moniteurs de ski"
              options={[
                { value: "dates", label: "Dates de formation", icon: Calendar },
                { value: "ecoles", label: "Écoles de ski", icon: School },
                { value: "base", label: "Base moniteurs", icon: Users },
              ]}
            />
          }
        />

        {PROSPECTION_MONITEURS_GELEE && (
          <Alert>
            <Snowflake className="h-4 w-4" />
            <AlertTitle>Prospection moniteurs gelée</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>{MESSAGE_GEL_PROSPECTION}</p>
              <p className="text-muted-foreground">{MESSAGE_GEL_REACTIVATION}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* KPI — les tuiles ouvrent la section qui détaille le chiffre. */}
        <StatTileGrid cols={3}>
          <StatTile
            label="Moniteurs actifs"
            value={stats?.active ?? 0}
            hint={`${stats?.total ?? 0} au total`}
            icon={Users}
            tone="blue"
            loading={statsLoading}
            onClick={() => setMoniteursTab("base")}
          />
          <StatTile
            label="Stations couvertes"
            value={stats?.stations ?? 0}
            hint="dans la base"
            icon={MapPin}
            tone="teal"
            loading={statsLoading}
          />
          <StatTile
            label="Dates programmées"
            value={scheduledIntakes.length}
            hint="confirmées ou ouvertes"
            icon={Calendar}
            tone="gold"
            loading={intakesLoading}
            onClick={() => setMoniteursTab("dates")}
          />
        </StatTileGrid>

        {moniteursTab === "ecoles" && <SkiSchoolMatchingCard />}

        {moniteursTab === "dates" && (
          intakesLoading ? (
            <CardGrid cols={3}>
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-56 animate-shimmer rounded-[var(--radius-card)]" />
              ))}
            </CardGrid>
          ) : intakes.length === 0 ? (
            <SurfaceCard>
              <TableEmpty
                title="Aucune date de formation"
                description="Créez une date fermée avec une école de ski partenaire."
                icon={Calendar}
                action={
                  <Button onClick={() => { setEditIntake(null); setIntakeFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle date
                  </Button>
                }
              />
            </SurfaceCard>
          ) : (
            <CardGrid cols={3}>
              {intakes.map((intake) => (
                <IntakeCard
                  key={intake.id}
                  intake={intake}
                  onEdit={() => { setEditIntake(intake); setIntakeFormOpen(true); }}
                  onSend={() => setSendTarget(intake)}
                  sending={sendOutreach.isPending}
                />
              ))}
            </CardGrid>
          )
        )}

        {moniteursTab === "base" && (
          <>
            <FilterBar
              search={{
                value: searchMonitors,
                onChange: (value) => {
                  setSearchMonitors(value);
                  setMonitorPage(1);
                },
                placeholder: "Rechercher nom, email, station...",
                ariaLabel: "Rechercher un moniteur",
              }}
              activeFilters={
                searchMonitors
                  ? [{
                      key: "search",
                      label: `Recherche : ${searchMonitors}`,
                      onRemove: () => { setSearchMonitors(""); setMonitorPage(1); },
                    }]
                  : undefined
              }
            />

            <SurfaceCard flush>
              {monitorsLoading ? (
                <TableSkeleton rows={8} cols={5} />
              ) : monitors.length === 0 ? (
                <TableEmpty
                  title="Base vide"
                  description="Importez vos contacts moniteurs pour l'outreach."
                  icon={Users}
                />
              ) : (
                <>
                  {/* Table à plat : une ligne = un moniteur, sans conteneur intermédiaire,
                      pour rester virtualisable si le volume l'impose. */}
                  <TableFrame>
                    <table className="hidden w-full md:table">
                      <thead>
                        <TableHeadRow>
                          <TableHeadCell>Nom</TableHeadCell>
                          <TableHeadCell>Email</TableHeadCell>
                          <TableHeadCell>École</TableHeadCell>
                          <TableHeadCell>Station</TableHeadCell>
                          <TableHeadCell>Statut</TableHeadCell>
                        </TableHeadRow>
                      </thead>
                      <tbody>
                        {monitors.map((m) => (
                          <TableRow
                            key={m.id}
                            onClick={PROSPECTION_MONITEURS_GELEE ? undefined : () => openMonitor(m)}
                          >
                            <TableCell className="font-medium">
                              {m.first_name} {m.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{m.email}</TableCell>
                            <TableCell hideBelow="md">{m.partner?.name || "—"}</TableCell>
                            <TableCell hideBelow="md">{m.home_station || "—"}</TableCell>
                            <TableCell>
                              <StatusPill tone={m.status === "active" ? "success" : "neutral"} size="sm">
                                {m.status === "active" ? "Actif" : "Désinscrit"}
                              </StatusPill>
                            </TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </table>
                  </TableFrame>

                  <CardList className="md:hidden">
                    {monitors.map((m) => (
                      <CardListItem
                        key={m.id}
                        onClick={PROSPECTION_MONITEURS_GELEE ? undefined : () => openMonitor(m)}
                        title={`${m.first_name} ${m.last_name}`}
                        subtitle={m.email}
                        meta={
                          <StatusPill tone={m.status === "active" ? "success" : "neutral"} size="sm">
                            {m.status === "active" ? "Actif" : "Désinscrit"}
                          </StatusPill>
                        }
                        fields={[
                          { label: "École", value: m.partner?.name || "—" },
                          { label: "Station", value: m.home_station || "—" },
                        ]}
                      />
                    ))}
                  </CardList>

                  {monitorTotalPages > 1 && (
                    <TablePagination
                      page={monitorPage}
                      pageSize={monitorPageSize}
                      total={monitorTotal}
                      onPageChange={(next) =>
                        setMonitorPage(Math.min(monitorTotalPages, Math.max(1, next)))
                      }
                      totalLabel={(total) => `${total.toLocaleString("fr-FR")} moniteurs au total`}
                    />
                  )}
                </>
              )}
            </SurfaceCard>
          </>
        )}
      </PageShell>

      <CourseIntakeFormDialog
        open={intakeFormOpen}
        onOpenChange={(o) => { setIntakeFormOpen(o); if (!o) setEditIntake(null); }}
        intake={editIntake}
      />

      <SkiMonitorFormDialog
        open={monitorFormOpen}
        onOpenChange={(o) => { setMonitorFormOpen(o); if (!o) setEditMonitor(null); }}
        monitor={editMonitor}
      />

      <SkiMonitorImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!sendTarget} onOpenChange={(o) => !o && setSendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Informer les moniteurs ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {sendTarget && (
                  <>
                    <p>
                      <strong>{sendTarget.language}</strong> à {sendTarget.location} — {sendTarget.partner?.name}
                    </p>
                    <p>
                      {sendTarget.open_to_other_schools
                        ? "📢 Tous les moniteurs actifs de la base recevront un email."
                        : `🔒 Seuls les moniteurs de ${sendTarget.partner?.name || "l'école hôte"} seront contactés.`}
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {!PROSPECTION_MONITEURS_GELEE && (
              <AlertDialogAction onClick={() => handleSend(false)} disabled={sendOutreach.isPending}>
                Envoyer les emails
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

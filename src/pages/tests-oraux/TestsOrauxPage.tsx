import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  CardList,
  CardListItem,
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
import { CreateBookingFromDemandeDialog } from "@/components/tests-oraux/CreateBookingFromDemandeDialog";
import { CreateEvaluationBookingDialog } from "@/components/evaluations/CreateEvaluationBookingDialog";
import {
  useMarkBookingCompleted,
  useScheduledTestBookings,
  useTestDemands,
  type TestDemandRow,
} from "@/hooks/useTestDemands";
import { useTestBookingsToEvaluate } from "@/hooks/useTestEvaluations";
import {
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  PROFESSION_LABELS,
} from "@/lib/evaluation-utils";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const TABS = [
  { value: "demandes", label: "Demandes" },
  { value: "reservations", label: "Réservations" },
  { value: "a-evaluer", label: "À évaluer" },
  { value: "completees", label: "Complétées" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Paiement",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: "En attente",
  stripe: "Carte",
  school_invoice: "Facture école",
  bank_transfer: "Virement",
  invoice: "Facture",
};

function isTab(value: string | null): value is TabValue {
  return TABS.some((t) => t.value === value);
}

export default function TestsOrauxPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: TabValue = isTab(rawTab) ? rawTab : "demandes";
  const { canEdit } = useUserPermissions();
  const editable = canEdit("evaluations");

  const demandsQuery = useTestDemands();
  const scheduledQuery = useScheduledTestBookings();
  const completedQuery = useTestBookingsToEvaluate();
  const markCompleted = useMarkBookingCompleted();

  const [selectedDemand, setSelectedDemand] = useState<TestDemandRow | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCreateEval, setShowCreateEval] = useState(false);

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const pendingEval = useMemo(
    () =>
      (completedQuery.data ?? []).filter(
        (b) => !b.evaluation_id || b.evaluation_status === "brouillon"
      ),
    [completedQuery.data]
  );
  const doneEval = useMemo(
    () =>
      (completedQuery.data ?? []).filter(
        (b) => b.evaluation_status && b.evaluation_status !== "brouillon"
      ),
    [completedQuery.data]
  );

  const copyPublicLink = async () => {
    const url = `${window.location.origin}/reserver-test`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié", { description: url });
    } catch {
      toast.error("Copie impossible", { description: url });
    }
  };

  const formatDate = (value: string | null | undefined) =>
    value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: fr }) : "—";

  const openCreateFromDemand = (demand: TestDemandRow) => {
    setSelectedDemand(demand);
    setShowBookingDialog(true);
  };

  const handleMarkCompleted = async (bookingId: string) => {
    try {
      await markCompleted.mutateAsync(bookingId);
      toast.success("Marqué comme réalisé", {
        description: "Le test apparaît dans À évaluer.",
      });
      setTab("a-evaluer");
    } catch (error) {
      toast.error("Mise à jour impossible", {
        description: error instanceof Error ? error.message : "Erreur",
      });
    }
  };

  const refreshAll = () => {
    void demandsQuery.refetch();
    void scheduledQuery.refetch();
    void completedQuery.refetch();
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Tests oraux SNMSF"
          description="Demandes, réservations et évaluations — remplace progressivement Forms + Sheets + Make."
          icon={ClipboardCheck}
          tone="gold"
          actions={
            <>
              <Button variant="outline" onClick={() => void copyPublicLink()}>
                <Copy className="mr-2 h-4 w-4" />
                Lien /reserver-test
              </Button>
              <Button variant="outline" asChild>
                <Link to="/reserver-test" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir
                </Link>
              </Button>
              {editable && (
                <Button onClick={() => setShowCreateEval(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle évaluation
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={refreshAll} aria-label="Actualiser">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          }
        />

        <StatTileGrid cols={4}>
          <StatTile
            label="Demandes"
            value={demandsQuery.data?.length ?? 0}
            icon={Inbox}
            tone="blue"
            loading={demandsQuery.isLoading}
          />
          <StatTile
            label="Réservations"
            value={scheduledQuery.data?.length ?? 0}
            icon={Calendar}
            tone="gold"
            loading={scheduledQuery.isLoading}
          />
          <StatTile
            label="À évaluer"
            value={pendingEval.length}
            icon={ClipboardCheck}
            tone="teal"
            loading={completedQuery.isLoading}
          />
          <StatTile
            label="Complétées"
            value={doneEval.length}
            icon={CheckCircle2}
            tone="teal"
            loading={completedQuery.isLoading}
          />
        </StatTileGrid>

        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({ value: t.value, label: t.label }))}
        />

        {tab === "demandes" && (
          <SurfaceCard
            title="Demandes en attente"
            description="Candidats issus de /reserver-test sans créneau confirmé."
            icon={Inbox}
          >
            {demandsQuery.isLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : (demandsQuery.data?.length ?? 0) === 0 ? (
              <TableEmpty title="Aucune demande en attente" />
            ) : (
              <>
                <div className="hidden md:block">
                  <TableFrame>
                    <thead>
                      <TableHeadRow>
                        <TableHeadCell>Candidat</TableHeadCell>
                        <TableHeadCell>École</TableHeadCell>
                        <TableHeadCell>Profession</TableHeadCell>
                        <TableHeadCell>Reçue</TableHeadCell>
                        <TableHeadCell className="text-right">Action</TableHeadCell>
                      </TableHeadRow>
                    </thead>
                    <tbody>
                      {(demandsQuery.data ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.email}
                              {row.phone ? ` · ${row.phone}` : ""}
                            </div>
                          </TableCell>
                          <TableCell>{row.ski_school_name ?? "—"}</TableCell>
                          <TableCell>
                            {row.profession
                              ? PROFESSION_LABELS[row.profession] || row.profession
                              : "—"}
                          </TableCell>
                          <TableCell>{formatDate(row.created_at)}</TableCell>
                          <TableCell className="text-right">
                            {editable && (
                              <Button size="sm" onClick={() => openCreateFromDemand(row)}>
                                Créer la réservation
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </TableFrame>
                </div>
                <CardList className="md:hidden">
                  {(demandsQuery.data ?? []).map((row) => (
                    <CardListItem
                      key={row.id}
                      title={row.name}
                      subtitle={`${row.email}${row.ski_school_name ? ` · ${row.ski_school_name}` : ""}`}
                      meta={formatDate(row.created_at)}
                      actions={
                        editable ? (
                          <Button size="sm" onClick={() => openCreateFromDemand(row)}>
                            Réserver
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </CardList>
              </>
            )}
          </SurfaceCard>
        )}

        {tab === "reservations" && (
          <SurfaceCard
            title="Réservations planifiées"
            description="Créneaux pending_payment / confirmed. Agenda et SMS arrivent en phase C."
            icon={Calendar}
          >
            {scheduledQuery.isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (scheduledQuery.data?.length ?? 0) === 0 ? (
              <TableEmpty title="Aucune réservation planifiée" />
            ) : (
              <TableFrame>
                <thead>
                  <TableHeadRow>
                    <TableHeadCell>Créneau</TableHeadCell>
                    <TableHeadCell>Candidat</TableHeadCell>
                    <TableHeadCell>Langue</TableHeadCell>
                    <TableHeadCell>Formateur</TableHeadCell>
                    <TableHeadCell>Statut</TableHeadCell>
                    <TableHeadCell className="text-right">Actions</TableHeadCell>
                  </TableHeadRow>
                </thead>
                <tbody>
                  {(scheduledQuery.data ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.datetime)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.candidate_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {PAYMENT_LABEL[row.payment_type] ?? row.payment_type}
                          {row.ski_school ? ` · ${row.ski_school}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <span>{LANGUAGE_FLAGS[row.language] || ""}</span>
                          <span>{LANGUAGE_LABELS[row.language] || row.language}</span>
                        </span>
                      </TableCell>
                      <TableCell>{row.instructor_name ?? "—"}</TableCell>
                      <TableCell>
                        <StatusPill tone={toneForStatus(row.status)}>
                          {STATUS_LABEL[row.status] ?? row.status}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        {editable && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={markCompleted.isPending}
                            onClick={() => void handleMarkCompleted(row.id)}
                          >
                            {markCompleted.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Marquer réalisé"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </TableFrame>
            )}
          </SurfaceCard>
        )}

        {tab === "a-evaluer" && (
          <SurfaceCard
            title="À évaluer"
            description="Tests réalisés sans évaluation finalisée."
            icon={ClipboardCheck}
          >
            {completedQuery.isLoading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : pendingEval.length === 0 ? (
              <TableEmpty title="Rien à évaluer pour le moment" />
            ) : (
              <TableFrame>
                <thead>
                  <TableHeadRow>
                    <TableHeadCell>Date</TableHeadCell>
                    <TableHeadCell>Candidat</TableHeadCell>
                    <TableHeadCell>Langue</TableHeadCell>
                    <TableHeadCell className="text-right">Saisie</TableHeadCell>
                  </TableHeadRow>
                </thead>
                <tbody>
                  {pendingEval.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.datetime)}</TableCell>
                      <TableCell>{row.candidate_name ?? "—"}</TableCell>
                      <TableCell>{LANGUAGE_LABELS[row.language || ""] || row.language}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/formateur/evaluation/${row.id}`)}
                        >
                          Saisir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </TableFrame>
            )}
          </SurfaceCard>
        )}

        {tab === "completees" && (
          <SurfaceCard
            title="Complétées"
            description="Évaluations hors brouillon. Envoi résultats reste sous validation Paula."
            icon={CheckCircle2}
          >
            {completedQuery.isLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : doneEval.length === 0 ? (
              <TableEmpty title="Aucune évaluation complétée" />
            ) : (
              <TableFrame>
                <thead>
                  <TableHeadRow>
                    <TableHeadCell>Date</TableHeadCell>
                    <TableHeadCell>Candidat</TableHeadCell>
                    <TableHeadCell>Langue</TableHeadCell>
                    <TableHeadCell>Statut</TableHeadCell>
                    <TableHeadCell className="text-right">Voir</TableHeadCell>
                  </TableHeadRow>
                </thead>
                <tbody>
                  {doneEval.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.datetime)}</TableCell>
                      <TableCell>{row.candidate_name ?? "—"}</TableCell>
                      <TableCell>{LANGUAGE_LABELS[row.language || ""] || row.language}</TableCell>
                      <TableCell>
                        <StatusPill tone={toneForStatus(row.evaluation_status || "")}>
                          {row.evaluation_status ?? "—"}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.evaluation_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(`/formateur/evaluation-view/${row.evaluation_id}`)
                            }
                          >
                            Ouvrir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </TableFrame>
            )}
          </SurfaceCard>
        )}
      </PageShell>

      <CreateBookingFromDemandeDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        demand={selectedDemand}
        onCreated={() => setTab("reservations")}
      />
      <CreateEvaluationBookingDialog
        open={showCreateEval}
        onOpenChange={setShowCreateEval}
        requireInstructorPick
        onCreated={(bookingId) => navigate(`/formateur/evaluation/${bookingId}`)}
      />
    </MainLayout>
  );
}

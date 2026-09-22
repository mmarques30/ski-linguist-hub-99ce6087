import { ReactNode, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  Calendar,
  Building2,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Eye,
  Edit,
  QrCode,
  ShieldCheck,
  Download,
  Loader2,
} from "lucide-react";
import { useTestBookingsToEvaluate } from "@/hooks/useTestEvaluations";
import { LANGUAGE_FLAGS, LANGUAGE_LABELS } from "@/lib/evaluation-utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SurveyQRCodeDialog } from "@/components/survey/SurveyQRCodeDialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EVALUATION_PDF_BUCKET } from "@/lib/evaluation-pdf";
import {
  EVAL_STATUS_LABEL,
  buildDsfXlsxBuffer,
  dsfExportFilename,
  dsfRowsForExport,
  evaluationCompanyName,
  matchesEvaluationFilters,
  uniqueSorted,
  type EvaluationListFilters,
} from "@/lib/dsf-evaluation-export";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import { FormateurAssistBanner } from "@/components/formateur/FormateurAssistBanner";
import { EvaluationStudentBridge } from "@/components/evaluations/EvaluationStudentBridge";
import {
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
  TableRow,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";

const ALL = "all";
const PDF_SIGNED_TTL_SEC = 7 * 24 * 3600;

const emptyFilters: EvaluationListFilters = {
  dateFrom: "",
  dateTo: "",
  company: ALL,
  station: ALL,
  language: ALL,
  evaluator: ALL,
  status: ALL,
};

/** Un filtre de la barre : libellé au-dessus du contrôle, largeur homogène. */
function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <Label htmlFor={htmlFor} className="text-2xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function EvaluationsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [filters, setFilters] = useState<EvaluationListFilters>(emptyFilters);
  const [exporting, setExporting] = useState(false);
  const { canEdit, isFormateur, isAdmin } = useUserPermissions();
  const { basePath, isAssistMode } = useFormateurView();
  const editable = canEdit("evaluations") && !isAssistMode;
  const canExportDsf = !isFormateur && !isAssistMode;

  const { data: allCompleted, isLoading: pendingLoading, refetch: refetchPending } =
    useTestBookingsToEvaluate();
  const completedLoading = pendingLoading;

  const filtered = useMemo(
    () => (allCompleted ?? []).filter((row) => matchesEvaluationFilters(row, filters)),
    [allCompleted, filters]
  );

  const pendingBookings = filtered.filter(
    (b) => !b.evaluation_id || b.evaluation_status === "brouillon"
  );
  const completedBookings = filtered.filter(
    (b) => b.evaluation_status && b.evaluation_status !== "brouillon"
  );

  const companyOptions = uniqueSorted((allCompleted ?? []).map(evaluationCompanyName));
  const stationOptions = uniqueSorted((allCompleted ?? []).map((r) => r.station));
  const languageOptions = uniqueSorted((allCompleted ?? []).map((r) => r.language));
  const evaluatorOptions = uniqueSorted((allCompleted ?? []).map((r) => r.instructor_name));
  const statusOptions = uniqueSorted((allCompleted ?? []).map((r) => r.evaluation_status));

  const handleRefresh = () => {
    refetchPending();
  };

  const setFilter = (key: keyof EvaluationListFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /** Rappel des filtres actifs, retirables un à un. */
  const activeFilters = [
    filters.dateFrom
      ? { key: "dateFrom", label: `Du ${filters.dateFrom}`, onRemove: () => setFilter("dateFrom", "") }
      : null,
    filters.dateTo
      ? { key: "dateTo", label: `Au ${filters.dateTo}`, onRemove: () => setFilter("dateTo", "") }
      : null,
    filters.company && filters.company !== ALL
      ? { key: "company", label: filters.company, onRemove: () => setFilter("company", ALL) }
      : null,
    filters.station && filters.station !== ALL
      ? { key: "station", label: filters.station, onRemove: () => setFilter("station", ALL) }
      : null,
    filters.language && filters.language !== ALL
      ? {
          key: "language",
          label: LANGUAGE_LABELS[filters.language] || filters.language,
          onRemove: () => setFilter("language", ALL),
        }
      : null,
    filters.evaluator && filters.evaluator !== ALL
      ? { key: "evaluator", label: filters.evaluator, onRemove: () => setFilter("evaluator", ALL) }
      : null,
    filters.status && filters.status !== ALL
      ? {
          key: "status",
          label: EVAL_STATUS_LABEL[filters.status] ?? filters.status,
          onRemove: () => setFilter("status", ALL),
        }
      : null,
  ].filter((chip): chip is { key: string; label: string; onRemove: () => void } => chip !== null);

  const handleExportDsf = async () => {
    if (!canExportDsf) return;
    setExporting(true);
    try {
      const source = filtered.filter((row) => row.sponsor_type === "dsf");
      if (source.length === 0) {
        toast({
          title: "Aucune ligne DSF",
          description: "Aucun test DSF ne correspond aux filtres.",
        });
        return;
      }
      const pdfLinks: Record<string, string> = {};
      await Promise.all(
        source.map(async (row) => {
          if (!row.id || !row.pdf_url) return;
          const { data, error } = await supabase.storage
            .from(EVALUATION_PDF_BUCKET)
            .createSignedUrl(row.pdf_url, PDF_SIGNED_TTL_SEC);
          if (!error && data?.signedUrl) {
            pdfLinks[row.id] = data.signedUrl;
          }
        })
      );
      const rows = dsfRowsForExport(source, {}, pdfLinks);
      const buffer = await buildDsfXlsxBuffer(rows);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = dsfExportFilename();
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Export DSF : ${rows.length} ligne(s)` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export DSF",
        description: error instanceof Error ? error.message : "Échec de l'export",
      });
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (value: string | null | undefined) =>
    value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: fr }) : "-";

  const languageCell = (code: string | null | undefined) => (
    <span className="inline-flex items-center gap-1">
      <span>{LANGUAGE_FLAGS[code || "all"]}</span>
      <span className="text-sm">{LANGUAGE_LABELS[code || "all"] || code}</span>
    </span>
  );

  return (
    <MainLayout>
      <PageShell>
        <FormateurAssistBanner />

        <PageHeader
          title="Évaluations"
          description={
            isAssistMode
              ? "Prévisualisation des évaluations de ce formateur"
              : "Gérer les évaluations de tests"
          }
          icon={ClipboardCheck}
          tone="gold"
          actions={
            <>
              {canExportDsf && (
                <Button variant="outline" onClick={handleExportDsf} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Exporter DSF
                </Button>
              )}
              {isFormateur ? (
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowQRDialog(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Satisfaction
                  </Button>
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </>
              )}
            </>
          }
        />

        {!isFormateur && (
          <SurveyQRCodeDialog open={showQRDialog} onOpenChange={setShowQRDialog} />
        )}

        {/* Compteurs — chacun ouvre l'onglet correspondant. */}
        <StatTileGrid cols={2}>
          <StatTile
            label="À évaluer"
            value={pendingBookings.length}
            icon={ClipboardCheck}
            tone="orange"
            loading={pendingLoading}
            onClick={() => setActiveTab("pending")}
          />
          <StatTile
            label="Complétées"
            value={completedBookings.length}
            icon={CheckCircle2}
            tone="teal"
            loading={completedLoading}
            onClick={() => setActiveTab("completed")}
          />
        </StatTileGrid>

        <SurfaceCard
          flush
          title={activeTab === "pending" ? "Tests en attente d'évaluation" : "Évaluations complétées"}
          icon={activeTab === "pending" ? ClipboardCheck : CheckCircle2}
          actions={
            <SegmentedControl<"pending" | "completed">
              value={activeTab}
              onChange={setActiveTab}
              size="sm"
              ariaLabel="Évaluations"
              options={[
                {
                  value: "pending",
                  label: "À évaluer",
                  icon: ClipboardCheck,
                  count: pendingBookings.length > 0 ? pendingBookings.length : undefined,
                },
                { value: "completed", label: "Complétées", icon: CheckCircle2 },
              ]}
            />
          }
          toolbar={
            <FilterBar
              filters={
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <FilterField label="Période du" htmlFor="eval-from">
                    <Input
                      id="eval-from"
                      type="date"
                      value={filters.dateFrom || ""}
                      onChange={(e) => setFilter("dateFrom", e.target.value)}
                    />
                  </FilterField>
                  <FilterField label="au" htmlFor="eval-to">
                    <Input
                      id="eval-to"
                      type="date"
                      value={filters.dateTo || ""}
                      onChange={(e) => setFilter("dateTo", e.target.value)}
                    />
                  </FilterField>
                  <FilterField label="Entreprise">
                    <Select
                      value={filters.company || ALL}
                      onValueChange={(v) => setFilter("company", v)}
                    >
                      <SelectTrigger aria-label="Entreprise">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Toutes</SelectItem>
                        {companyOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                  <FilterField label="Station">
                    <Select
                      value={filters.station || ALL}
                      onValueChange={(v) => setFilter("station", v)}
                    >
                      <SelectTrigger aria-label="Station">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Toutes</SelectItem>
                        {stationOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                  <FilterField label="Langue">
                    <Select
                      value={filters.language || ALL}
                      onValueChange={(v) => setFilter("language", v)}
                    >
                      <SelectTrigger aria-label="Langue">
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Toutes</SelectItem>
                        {languageOptions.map((code) => (
                          <SelectItem key={code} value={code}>
                            {LANGUAGE_LABELS[code] || code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                  <FilterField label="Évaluateur·rice">
                    <Select
                      value={filters.evaluator || ALL}
                      onValueChange={(v) => setFilter("evaluator", v)}
                    >
                      <SelectTrigger aria-label="Évaluateur·rice">
                        <SelectValue placeholder="Tou·te·s" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tou·te·s</SelectItem>
                        {evaluatorOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                  <FilterField label="Statut">
                    <Select
                      value={filters.status || ALL}
                      onValueChange={(v) => setFilter("status", v)}
                    >
                      <SelectTrigger aria-label="Statut">
                        <SelectValue placeholder="Tous" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tous</SelectItem>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {EVAL_STATUS_LABEL[status] ?? status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterField>
                  <div className="flex items-end">
                    <Button variant="ghost" onClick={() => setFilters(emptyFilters)}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              }
              activeFilters={activeFilters}
            />
          }
        >
          {activeTab === "pending" ? (
            <>
              <TableFrame>
                <table className="hidden w-full md:table">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Candidat</TableHeadCell>
                      <TableHeadCell>École</TableHeadCell>
                      <TableHeadCell>Langue</TableHeadCell>
                      <TableHeadCell>Profession</TableHeadCell>
                      <TableHeadCell>Stagiaire</TableHeadCell>
                      <TableHeadCell className="w-24">
                        <span className="sr-only">Actions</span>
                      </TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {pendingLoading ? (
                      <tr>
                        <td colSpan={7}>
                          <TableSkeleton rows={3} cols={7} />
                        </td>
                      </tr>
                    ) : pendingBookings.length === 0 ? (
                      <TableEmpty
                        colSpan={7}
                        icon={ClipboardCheck}
                        title="Aucune évaluation en attente"
                        description={
                          (allCompleted ?? []).length === 0
                            ? "Aucun test oral terminé n'est encore enregistré. Les réservations apparaîtront ici une fois marquées comme complétées."
                            : "Tous les tests terminés ont déjà une évaluation (hors brouillon)."
                        }
                      />
                    ) : (
                      pendingBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <span className="flex items-center gap-2 tabular">
                              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {formatDate(booking.datetime)}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{booking.candidate_name}</TableCell>
                          <TableCell hideBelow="lg">
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {booking.ski_school_name}
                            </span>
                          </TableCell>
                          <TableCell>{languageCell(booking.language)}</TableCell>
                          <TableCell hideBelow="xl">
                            <StatusPill tone="neutral" size="sm">
                              {booking.candidate_profession || "-"}
                            </StatusPill>
                          </TableCell>
                          <TableCell hideBelow="lg">
                            <EvaluationStudentBridge
                              candidateId={booking.candidate_id}
                              studentId={booking.student_id}
                              candidateName={booking.candidate_name}
                              candidateEmail={booking.candidate_email}
                              editable={editable && !isFormateur}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {booking.evaluation_status && (
                                <StatusPill
                                  tone={toneForStatus(booking.evaluation_status)}
                                  size="sm"
                                >
                                  {EVAL_STATUS_LABEL[booking.evaluation_status] ??
                                    booking.evaluation_status}
                                </StatusPill>
                              )}
                              {editable ? (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      booking.evaluation_id
                                        ? `${basePath}/evaluation/${booking.id}/edit`
                                        : `${basePath}/evaluation/${booking.id}`
                                    )
                                  }
                                >
                                  {booking.evaluation_id ? "Continuer" : "Évaluer"}
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              ) : (
                                <StatusPill tone="warning" size="sm">En attente</StatusPill>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </table>
              </TableFrame>

              {/* Doublure mobile du tableau. */}
              <CardList className="md:hidden">
                {pendingLoading ? (
                  <TableSkeleton rows={3} cols={4} />
                ) : pendingBookings.length === 0 ? (
                  <TableEmpty
                    icon={ClipboardCheck}
                    title="Aucune évaluation en attente"
                    description={
                      (allCompleted ?? []).length === 0
                        ? "Aucun test oral terminé n'est encore enregistré. Les réservations apparaîtront ici une fois marquées comme complétées."
                        : "Tous les tests terminés ont déjà une évaluation (hors brouillon)."
                    }
                  />
                ) : (
                  pendingBookings.map((booking) => (
                    <CardListItem
                      key={booking.id}
                      title={booking.candidate_name}
                      subtitle={booking.ski_school_name}
                      meta={
                        booking.evaluation_status ? (
                          <StatusPill tone={toneForStatus(booking.evaluation_status)} size="sm">
                            {EVAL_STATUS_LABEL[booking.evaluation_status] ??
                              booking.evaluation_status}
                          </StatusPill>
                        ) : undefined
                      }
                      fields={[
                        { label: "Date", value: formatDate(booking.datetime) },
                        { label: "Langue", value: languageCell(booking.language) },
                        { label: "Profession", value: booking.candidate_profession || "-" },
                      ]}
                      actions={
                        <>
                          <EvaluationStudentBridge
                            candidateId={booking.candidate_id}
                            studentId={booking.student_id}
                            candidateName={booking.candidate_name}
                            candidateEmail={booking.candidate_email}
                            editable={editable && !isFormateur}
                          />
                          {editable ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(
                                  booking.evaluation_id
                                    ? `${basePath}/evaluation/${booking.id}/edit`
                                    : `${basePath}/evaluation/${booking.id}`
                                )
                              }
                            >
                              {booking.evaluation_id ? "Continuer" : "Évaluer"}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          ) : (
                            <StatusPill tone="warning" size="sm">En attente</StatusPill>
                          )}
                        </>
                      }
                    />
                  ))
                )}
              </CardList>
            </>
          ) : (
            <>
              <TableFrame>
                <table className="hidden w-full md:table">
                  <thead>
                    <TableHeadRow>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Candidat</TableHeadCell>
                      <TableHeadCell>Entreprise</TableHeadCell>
                      <TableHeadCell>Station</TableHeadCell>
                      <TableHeadCell>Langue</TableHeadCell>
                      <TableHeadCell>Score</TableHeadCell>
                      <TableHeadCell>Stagiaire</TableHeadCell>
                      <TableHeadCell className="w-32">
                        <span className="sr-only">Actions</span>
                      </TableHeadCell>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {completedLoading ? (
                      <tr>
                        <td colSpan={8}>
                          <TableSkeleton rows={3} cols={8} />
                        </td>
                      </tr>
                    ) : completedBookings.length === 0 ? (
                      <TableEmpty
                        colSpan={8}
                        icon={ClipboardCheck}
                        title="Aucune évaluation complétée"
                        description="Les évaluations soumises apparaîtront ici."
                      />
                    ) : (
                      completedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <span className="flex items-center gap-2 tabular">
                              <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {formatDate(booking.datetime)}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {/* L'id d'évaluation est déjà là : le nom ouvre la fiche. */}
                            {booking.evaluation_id ? (
                              <Link
                                to={`${basePath}/evaluation-view/${booking.evaluation_id}`}
                                className="hover:underline"
                              >
                                {booking.candidate_name}
                              </Link>
                            ) : (
                              booking.candidate_name
                            )}
                          </TableCell>
                          <TableCell hideBelow="lg">
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                              {evaluationCompanyName(booking) || booking.ski_school_name || "-"}
                            </span>
                          </TableCell>
                          <TableCell hideBelow="xl">{booking.station || "-"}</TableCell>
                          <TableCell hideBelow="lg">{languageCell(booking.language)}</TableCell>
                          <TableCell>
                            {booking.score_general !== null && (
                              <StatusPill
                                tone={toneForStatus(booking.evaluation_status)}
                                size="sm"
                                className="tabular"
                              >
                                {booking.score_general}
                                {booking.evaluation_status
                                  ? ` · ${EVAL_STATUS_LABEL[booking.evaluation_status] ?? booking.evaluation_status}`
                                  : ""}
                              </StatusPill>
                            )}
                          </TableCell>
                          <TableCell hideBelow="xl">
                            <EvaluationStudentBridge
                              candidateId={booking.candidate_id}
                              studentId={booking.student_id}
                              candidateName={booking.candidate_name}
                              candidateEmail={booking.candidate_email}
                              editable={editable && !isFormateur}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isAdmin &&
                                booking.evaluation_status === "a_verifier" &&
                                booking.evaluation_id && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `${basePath}/evaluations/${booking.evaluation_id}/verifier`
                                      )
                                    }
                                  >
                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                    Vérifier
                                  </Button>
                                )}
                              <Button
                                size="sm"
                                variant="outline"
                                aria-label="Voir l'évaluation"
                                onClick={() =>
                                  navigate(`${basePath}/evaluation-view/${booking.evaluation_id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {editable && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  aria-label="Modifier l'évaluation"
                                  onClick={() =>
                                    navigate(`${basePath}/evaluation/${booking.id}/edit`)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </table>
              </TableFrame>

              {/* Doublure mobile du tableau. */}
              <CardList className="md:hidden">
                {completedLoading ? (
                  <TableSkeleton rows={3} cols={4} />
                ) : completedBookings.length === 0 ? (
                  <TableEmpty
                    icon={ClipboardCheck}
                    title="Aucune évaluation complétée"
                    description="Les évaluations soumises apparaîtront ici."
                  />
                ) : (
                  completedBookings.map((booking) => (
                    <CardListItem
                      key={booking.id}
                      title={
                        booking.evaluation_id ? (
                          <Link
                            to={`${basePath}/evaluation-view/${booking.evaluation_id}`}
                            className="hover:underline"
                          >
                            {booking.candidate_name}
                          </Link>
                        ) : (
                          booking.candidate_name
                        )
                      }
                      subtitle={evaluationCompanyName(booking) || booking.ski_school_name || "-"}
                      meta={
                        booking.score_general !== null ? (
                          <StatusPill
                            tone={toneForStatus(booking.evaluation_status)}
                            size="sm"
                            className="tabular"
                          >
                            {booking.score_general}
                            {booking.evaluation_status
                              ? ` · ${EVAL_STATUS_LABEL[booking.evaluation_status] ?? booking.evaluation_status}`
                              : ""}
                          </StatusPill>
                        ) : undefined
                      }
                      fields={[
                        { label: "Date", value: formatDate(booking.datetime) },
                        { label: "Station", value: booking.station || "-" },
                        { label: "Langue", value: languageCell(booking.language) },
                      ]}
                      actions={
                        <>
                          <EvaluationStudentBridge
                            candidateId={booking.candidate_id}
                            studentId={booking.student_id}
                            candidateName={booking.candidate_name}
                            candidateEmail={booking.candidate_email}
                            editable={editable && !isFormateur}
                          />
                          {isAdmin &&
                            booking.evaluation_status === "a_verifier" &&
                            booking.evaluation_id && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `${basePath}/evaluations/${booking.evaluation_id}/verifier`
                                  )
                                }
                              >
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Vérifier
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label="Voir l'évaluation"
                            onClick={() =>
                              navigate(`${basePath}/evaluation-view/${booking.evaluation_id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {editable && (
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label="Modifier l'évaluation"
                              onClick={() => navigate(`${basePath}/evaluation/${booking.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      }
                    />
                  ))
                )}
              </CardList>
            </>
          )}
        </SurfaceCard>
      </PageShell>
    </MainLayout>
  );
}

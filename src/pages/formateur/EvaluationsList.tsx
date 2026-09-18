import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
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

export default function EvaluationsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <FormateurAssistBanner />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Évaluations</h1>
            <p className="text-muted-foreground">
              {isAssistMode
                ? "Prévisualisation des évaluations de ce formateur"
                : "Gérer les évaluations de tests"}
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        {!isFormateur && (
          <SurveyQRCodeDialog open={showQRDialog} onOpenChange={setShowQRDialog} />
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label htmlFor="eval-from">Période du</Label>
              <Input
                id="eval-from"
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eval-to">au</Label>
              <Input
                id="eval-to"
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => setFilter("dateTo", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Entreprise</Label>
              <Select
                value={filters.company || ALL}
                onValueChange={(v) => setFilter("company", v)}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1">
              <Label>Station</Label>
              <Select
                value={filters.station || ALL}
                onValueChange={(v) => setFilter("station", v)}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1">
              <Label>Langue</Label>
              <Select
                value={filters.language || ALL}
                onValueChange={(v) => setFilter("language", v)}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1">
              <Label>Évaluateur·rice</Label>
              <Select
                value={filters.evaluator || ALL}
                onValueChange={(v) => setFilter("evaluator", v)}
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select
                value={filters.status || ALL}
                onValueChange={(v) => setFilter("status", v)}
              >
                <SelectTrigger>
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
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => setFilters(emptyFilters)}>
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                À évaluer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingLoading ? <Skeleton className="h-8 w-12" /> : pendingBookings.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Complétées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  completedBookings.length
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              À évaluer
              {pendingBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Complétées
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Tests en attente d'évaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Candidat</TableHead>
                      <TableHead>École</TableHead>
                      <TableHead>Langue</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : pendingBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            Toutes les évaluations sont à jour !
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {booking.datetime ? (
                                format(new Date(booking.datetime), "dd/MM/yyyy HH:mm", { locale: fr })
                              ) : (
                                "-"
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {booking.candidate_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {booking.ski_school_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{LANGUAGE_FLAGS[booking.language || "all"]}</span>
                              <span className="text-sm">
                                {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {booking.candidate_profession || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {booking.evaluation_status && (
                                <Badge
                                  variant={
                                    booking.evaluation_status === "brouillon"
                                      ? "secondary"
                                      : "default"
                                  }
                                >
                                  {EVAL_STATUS_LABEL[booking.evaluation_status] ??
                                    booking.evaluation_status}
                                </Badge>
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
                                <Badge variant="secondary">En attente</Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Évaluations complétées
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Candidat</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Langue</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : completedBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            Aucune évaluation complétée
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {booking.datetime ? (
                                format(new Date(booking.datetime), "dd/MM/yyyy HH:mm", { locale: fr })
                              ) : (
                                "-"
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {booking.candidate_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {evaluationCompanyName(booking) || booking.ski_school_name || "-"}
                            </div>
                          </TableCell>
                          <TableCell>{booking.station || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{LANGUAGE_FLAGS[booking.language || "all"]}</span>
                              <span className="text-sm">
                                {LANGUAGE_LABELS[booking.language || "all"] || booking.language}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.score_general !== null && (
                              <Badge variant="default">
                                {booking.score_general}
                                {booking.evaluation_status
                                  ? ` · ${EVAL_STATUS_LABEL[booking.evaluation_status] ?? booking.evaluation_status}`
                                  : ""}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useSatisfactionStats,
  useSeasonComparison,
  SatisfactionFilters,
  PeriodFilter,
  LanguageFilter,
  SeasonFilter,
  SeasonComparisonFilters,
  CustomDateRange,
  SEASON_LABELS
} from "@/hooks/useSatisfactionStats";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Users,
  Star,
  MessageSquare,
  Award,
  Target,
  Calendar,
  Languages,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
  FileDown,
  BarChart3,
  LineChart as LineChartIcon
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  BarsChart,
  CHART_CHROME,
  ChartFrame,
  ChartLegend,
  MeterRow,
  PageHeader,
  PageShell,
  SectionHeading,
  SegmentedControl,
  StatTile,
  StatTileGrid,
  StatusPill,
  STATE_COLORS,
  SurfaceCard,
  TableEmpty,
  TrendChart,
  axisProps,
  makeTooltipRenderer,
  seriesColor,
} from "@/components/ui-kit";
import type { PillTone, TileTone } from "@/components/ui-kit";

/**
 * Indicateur Qualiopi : une valeur face à sa cible.
 * La cible reste celle du référentiel (50 % / 80 % / 3,5 sur 5) — on ne fait
 * qu'habiller la barre avec `MeterRow`.
 */
function QualiopiIndicator({ label, value, target, unit = "%" }: {
  label: string;
  value: number;
  target: number;
  unit?: string;
}) {
  const isAboveTarget = value >= target;

  return (
    <MeterRow
      label={
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{label}</span>
          <StatusPill tone={isAboveTarget ? "success" : "warning"} size="sm">
            Objectif : {target}{unit}
          </StatusPill>
        </span>
      }
      value={value}
      max={target}
      display={`${value.toFixed(1)}${unit}`}
      color={isAboveTarget ? STATE_COLORS.good : STATE_COLORS.warning}
    />
  );
}

interface SatisfactionStatsData {
  totalSurveys: number;
  completedSurveys: number;
  responseRate: number;
  averageScores: {
    content: number;
    animation: number;
    duration: number;
    utility: number;
    materials: number;
    organization: number;
    expectations: number;
    overall: number;
  };
  qualiopiIndicators: {
    satisfactionRate: number;
    responseRate: number;
    averageScore: number;
    trend: "up" | "down" | "stable";
  };
  categoryBreakdown: {
    category: string;
    score: number;
    label: string;
  }[];
  recentFeedback: {
    id: string;
    completedAt: string;
    averageScore: number;
    strongPoints: string | null;
    weakPoints: string | null;
  }[];
}

function generateQualioPDF(stats: SatisfactionStatsData, periodLabel: string, languageLabel: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport de Satisfaction - Indicateurs Qualiopi", pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("FLI - Formation Linguistique pour Instructeurs", pageWidth / 2, yPos, { align: "center" });

  yPos += 8;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Généré le ${format(new Date(), "dd MMMM yyyy à HH:mm", { locale: fr })}`, pageWidth / 2, yPos, { align: "center" });
  doc.text(`Période: ${periodLabel} | Langue: ${languageLabel}`, pageWidth / 2, yPos + 5, { align: "center" });
  doc.setTextColor(0);

  yPos += 20;

  // Section: Indicateurs Qualiopi principaux
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. Indicateurs Qualiopi Principaux", 20, yPos);
  yPos += 10;

  // Draw indicators table
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const indicators = [
    { label: "Taux de réponse aux questionnaires", value: `${stats.responseRate.toFixed(1)}%`, target: "50%", status: stats.responseRate >= 50 ? "✓ Conforme" : "⚠ À améliorer" },
    { label: "Taux de satisfaction globale (note ≥ 3.5/5)", value: `${stats.qualiopiIndicators.satisfactionRate.toFixed(1)}%`, target: "80%", status: stats.qualiopiIndicators.satisfactionRate >= 80 ? "✓ Conforme" : "⚠ À améliorer" },
    { label: "Note moyenne de satisfaction", value: `${stats.averageScores.overall.toFixed(2)}/5`, target: "3.5/5", status: stats.averageScores.overall >= 3.5 ? "✓ Conforme" : "⚠ À améliorer" },
  ];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, pageWidth - 40, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Indicateur", 25, yPos + 5);
  doc.text("Valeur", 110, yPos + 5);
  doc.text("Objectif", 140, yPos + 5);
  doc.text("Statut", 165, yPos + 5);
  yPos += 10;

  doc.setFont("helvetica", "normal");
  indicators.forEach((ind) => {
    doc.text(ind.label, 25, yPos + 4);
    doc.text(ind.value, 110, yPos + 4);
    doc.text(ind.target, 140, yPos + 4);
    doc.setTextColor(ind.status.includes("Conforme") ? 0 : 150, ind.status.includes("Conforme") ? 128 : 100, 0);
    doc.text(ind.status, 165, yPos + 4);
    doc.setTextColor(0);
    doc.line(20, yPos + 7, pageWidth - 20, yPos + 7);
    yPos += 10;
  });

  yPos += 10;

  // Section: Volume de données
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("2. Volume de Données", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`• Nombre total de questionnaires envoyés: ${stats.totalSurveys}`, 25, yPos);
  yPos += 6;
  doc.text(`• Nombre de questionnaires complétés: ${stats.completedSurveys}`, 25, yPos);
  yPos += 6;
  doc.text(`• Taux de réponse effectif: ${stats.responseRate.toFixed(1)}%`, 25, yPos);
  yPos += 15;

  // Section: Notes détaillées par critère
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3. Notes Détaillées par Critère de Satisfaction", 20, yPos);
  yPos += 10;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, pageWidth - 40, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Critère", 25, yPos + 5);
  doc.text("Note /5", 120, yPos + 5);
  doc.text("Appréciation", 150, yPos + 5);
  yPos += 10;

  doc.setFont("helvetica", "normal");
  stats.categoryBreakdown.forEach((cat) => {
    const appreciation = cat.score >= 4.5 ? "Excellent" : cat.score >= 4 ? "Très bien" : cat.score >= 3.5 ? "Bien" : cat.score >= 3 ? "Satisfaisant" : "À améliorer";
    doc.text(cat.label, 25, yPos + 4);
    doc.text(cat.score.toFixed(2), 120, yPos + 4);
    doc.setTextColor(cat.score >= 3.5 ? 0 : 150, cat.score >= 3.5 ? 128 : 0, 0);
    doc.text(appreciation, 150, yPos + 4);
    doc.setTextColor(0);
    doc.line(20, yPos + 7, pageWidth - 20, yPos + 7);
    yPos += 10;
  });

  yPos += 15;

  // Section: Graphique Radar
  if (yPos > 140) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3.1 Visualisation Radar des Critères", 20, yPos);
  yPos += 10;

  // Draw radar chart
  const radarCenterX = pageWidth / 2;
  const radarCenterY = yPos + 55;
  const radarRadius = 45;
  const numAxes = stats.categoryBreakdown.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Draw grid circles (representing scores 1-5)
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  for (let level = 1; level <= 5; level++) {
    const levelRadius = (level / 5) * radarRadius;
    doc.setLineDashPattern([1, 1], 0);

    // Draw polygon for this level
    for (let i = 0; i < numAxes; i++) {
      const angle1 = i * angleStep - Math.PI / 2;
      const angle2 = (i + 1) * angleStep - Math.PI / 2;
      const x1 = radarCenterX + levelRadius * Math.cos(angle1);
      const y1 = radarCenterY + levelRadius * Math.sin(angle1);
      const x2 = radarCenterX + levelRadius * Math.cos(angle2);
      const y2 = radarCenterY + levelRadius * Math.sin(angle2);
      doc.line(x1, y1, x2, y2);
    }
  }

  // Draw axes
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(150);
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = radarCenterX + radarRadius * Math.cos(angle);
    const y = radarCenterY + radarRadius * Math.sin(angle);
    doc.line(radarCenterX, radarCenterY, x, y);
  }

  // Draw data polygon outline
  doc.setDrawColor(59, 130, 246); // Blue
  doc.setLineWidth(1.5);

  const dataPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const score = stats.categoryBreakdown[i].score;
    const dataRadius = (score / 5) * radarRadius;
    const x = radarCenterX + dataRadius * Math.cos(angle);
    const y = radarCenterY + dataRadius * Math.sin(angle);
    dataPoints.push({ x, y });
  }

  // Draw outline
  for (let i = 0; i < dataPoints.length; i++) {
    const next = (i + 1) % dataPoints.length;
    doc.line(dataPoints[i].x, dataPoints[i].y, dataPoints[next].x, dataPoints[next].y);
  }

  // Draw data points
  doc.setFillColor(59, 130, 246);
  dataPoints.forEach(point => {
    doc.circle(point.x, point.y, 1.5, "F");
  });

  // Draw labels with scores
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.setLineWidth(0.5);
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radarRadius + 12;
    let x = radarCenterX + labelRadius * Math.cos(angle);
    let y = radarCenterY + labelRadius * Math.sin(angle);

    const label = stats.categoryBreakdown[i].label;
    const shortLabel = label.length > 12 ? label.substring(0, 10) + "..." : label;
    const score = stats.categoryBreakdown[i].score.toFixed(1);

    // Adjust text alignment based on position
    let align: "left" | "center" | "right" = "center";
    if (Math.cos(angle) < -0.3) align = "right";
    else if (Math.cos(angle) > 0.3) align = "left";

    // Adjust vertical position
    if (Math.sin(angle) < -0.5) y -= 2;
    else if (Math.sin(angle) > 0.5) y += 4;

    doc.text(`${shortLabel} (${score})`, x, y, { align });
  }

  // Scale legend
  doc.setFontSize(6);
  doc.setTextColor(100);
  doc.text("Échelle: 0 (centre) à 5 (bord)", radarCenterX, radarCenterY + radarRadius + 18, { align: "center" });
  doc.setTextColor(0);

  yPos = radarCenterY + radarRadius + 28;

  // Section: Points forts (verbatims)
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("4. Points Forts (Verbatims Stagiaires)", 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const strongPoints = stats.recentFeedback
    .filter(f => f.strongPoints && f.strongPoints.trim())
    .slice(0, 8);

  if (strongPoints.length > 0) {
    strongPoints.forEach((feedback) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      const text = `• "${feedback.strongPoints}"`;
      const lines = doc.splitTextToSize(text, pageWidth - 50);
      doc.text(lines, 25, yPos);
      yPos += lines.length * 4 + 3;
    });
  } else {
    doc.setTextColor(128);
    doc.text("Aucun commentaire disponible pour cette période.", 25, yPos);
    doc.setTextColor(0);
    yPos += 8;
  }

  yPos += 8;

  // Section: Axes d'amélioration (verbatims)
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("5. Axes d'Amélioration (Verbatims Stagiaires)", 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const weakPoints = stats.recentFeedback
    .filter(f => f.weakPoints && f.weakPoints.trim())
    .slice(0, 8);

  if (weakPoints.length > 0) {
    weakPoints.forEach((feedback) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      const text = `• "${feedback.weakPoints}"`;
      const lines = doc.splitTextToSize(text, pageWidth - 50);
      doc.text(lines, 25, yPos);
      yPos += lines.length * 4 + 3;
    });
  } else {
    doc.setTextColor(128);
    doc.text("Aucun commentaire disponible pour cette période.", 25, yPos);
    doc.setTextColor(0);
    yPos += 8;
  }

  yPos += 10;

  // Section: Synthèse
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("6. Synthèse et Conformité Qualiopi", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const allCompliant = stats.responseRate >= 50 && stats.qualiopiIndicators.satisfactionRate >= 80 && stats.averageScores.overall >= 3.5;

  if (allCompliant) {
    doc.setFillColor(220, 252, 231);
    doc.rect(20, yPos - 3, pageWidth - 40, 20, "F");
    doc.setTextColor(22, 101, 52);
    doc.text("✓ CONFORME AUX EXIGENCES QUALIOPI", pageWidth / 2, yPos + 5, { align: "center" });
    doc.text("Tous les indicateurs de satisfaction répondent aux objectifs fixés.", pageWidth / 2, yPos + 12, { align: "center" });
  } else {
    doc.setFillColor(254, 243, 199);
    doc.rect(20, yPos - 3, pageWidth - 40, 20, "F");
    doc.setTextColor(146, 64, 14);
    doc.text("⚠ AXES D'AMÉLIORATION IDENTIFIÉS", pageWidth / 2, yPos + 5, { align: "center" });
    doc.text("Certains indicateurs nécessitent une attention particulière.", pageWidth / 2, yPos + 12, { align: "center" });
  }
  doc.setTextColor(0);

  yPos += 30;

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    if (i === pageCount) {
      doc.text("Ce rapport a été généré automatiquement par le système de gestion FLI.", pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });
      doc.text("Document à conserver pour les audits Qualiopi - Critère 7.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }
  }
  doc.setTextColor(0);

  // Save PDF
  const fileName = `rapport-satisfaction-qualiopi-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
  toast.success("Rapport PDF généré avec succès");
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Toutes les périodes" },
  { value: "thisMonth", label: "Ce mois" },
  { value: "lastMonth", label: "Mois dernier" },
  { value: "thisQuarter", label: "Ce trimestre" },
  { value: "lastQuarter", label: "Trimestre dernier" },
  { value: "thisYear", label: "Cette année" },
  { value: "lastYear", label: "Année dernière" },
  { value: "last3Months", label: "3 derniers mois" },
  { value: "last6Months", label: "6 derniers mois" },
  { value: "last12Months", label: "12 derniers mois" },
];

const languageOptions: { value: LanguageFilter; label: string }[] = [
  { value: "all", label: "Toutes les langues" },
  { value: "Anglais", label: "Anglais" },
  { value: "Espagnol", label: "Espagnol" },
  { value: "Français", label: "Français" },
  { value: "Allemand", label: "Allemand" },
  { value: "Italien", label: "Italien" },
  { value: "Portugais brésilien", label: "Portugais brésilien" },
];

const seasonOptions: { value: SeasonFilter; label: string }[] = [
  { value: "all", label: "Sélectionner une période" },
  { value: "custom", label: "📅 Période personnalisée" },
  { value: "autumn2025", label: "Automne 2025" },
  { value: "summer2025", label: "Été 2025" },
  { value: "spring2025", label: "Printemps 2025" },
  { value: "winter2024", label: "Hiver 2024/25" },
  { value: "autumn2024", label: "Automne 2024" },
  { value: "summer2024", label: "Été 2024" },
  { value: "spring2024", label: "Printemps 2024" },
];

function DateRangePicker({
  label,
  dateRange,
  onDateRangeChange
}: {
  label: string;
  dateRange: CustomDateRange;
  onDateRangeChange: (range: CustomDateRange) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !dateRange.start && "text-muted-foreground"
              )}
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              {dateRange.start ? format(dateRange.start, "dd/MM/yy", { locale: fr }) : "Début"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateRange.start || undefined}
              onSelect={(date) => onDateRangeChange({ ...dateRange, start: date || null })}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !dateRange.end && "text-muted-foreground"
              )}
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              {dateRange.end ? format(dateRange.end, "dd/MM/yy", { locale: fr }) : "Fin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateRange.end || undefined}
              onSelect={(date) => onDateRangeChange({ ...dateRange, end: date || null })}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/**
 * Écart entre deux périodes. L'unité varie (points, %, /5) : on garde donc un
 * rendu dédié plutôt que `DeltaBadge`, qui suppose un pourcentage.
 */
function DeltaIndicator({ value, unit = "", positiveIsGood = true }: { value: number; unit?: string; positiveIsGood?: boolean }) {
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  if (Math.abs(value) < 0.01) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="h-3 w-3" />
        stable
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 text-sm font-medium tabular"
      style={{ color: isGood ? STATE_COLORS.good : STATE_COLORS.critical }}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}{unit}
    </span>
  );
}

/** Pastille de tendance — la couleur n'est jamais seule, le libellé la double. */
function TrendPill({ trend, label }: { trend: "up" | "down" | "stable"; label: string }) {
  const tone: PillTone = trend === "up" ? "success" : trend === "down" ? "danger" : "neutral";
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <StatusPill tone={tone} size="sm" icon={Icon}>
      {label}
    </StatusPill>
  );
}

const scoreTooltip = makeTooltipRenderer({
  formatValue: (value) => `${Number(value).toFixed(2)}/5`,
});

export default function SatisfactionStats() {
  const [activeTab, setActiveTab] = useState<"overview" | "comparison">("overview");
  const [filters, setFilters] = useState<SatisfactionFilters>({
    period: "all",
    language: "all",
  });
  const [comparisonFilters, setComparisonFilters] = useState<SeasonComparisonFilters>({
    currentSeason: "autumn2025",
    comparisonSeason: "autumn2024",
    language: "all",
    customCurrentRange: { start: null, end: null },
    customComparisonRange: { start: null, end: null },
  });

  const { data: stats, isLoading } = useSatisfactionStats(filters);
  const { data: comparison, isLoading: isLoadingComparison } = useSeasonComparison(comparisonFilters);

  const tabs = (
    <SegmentedControl<"overview" | "comparison">
      value={activeTab}
      onChange={setActiveTab}
      ariaLabel="Vue des statistiques de satisfaction"
      options={[
        { value: "overview", label: "Vue d'ensemble", icon: Target },
        { value: "comparison", label: "Comparaison", icon: GitCompare },
      ]}
    />
  );

  if (isLoading) {
    return (
      <MainLayout>
        <PageShell>
          <PageHeader
            title="Statistiques de Satisfaction"
            description="Indicateurs Qualiopi et analyse des retours stagiaires"
            icon={Star}
            tone="gold"
            tabs={tabs}
          />
          <StatTileGrid cols={4}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[var(--radius-card)]" />
            ))}
          </StatTileGrid>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80 rounded-[var(--radius-card)]" />
            <Skeleton className="h-80 rounded-[var(--radius-card)]" />
          </div>
        </PageShell>
      </MainLayout>
    );
  }

  if (!stats) return null;

  const monthLabels: Record<string, string> = {};
  stats.monthlyData.forEach((d) => {
    const [year, month] = d.month.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    monthLabels[d.month] = format(date, "MMM yy", { locale: fr });
  });

  /** Mêmes chiffres, libellés de mois déjà résolus pour les deux graphiques. */
  const monthlyChartData = stats.monthlyData.map((d) => ({
    month: d.month,
    label: monthLabels[d.month] || d.month,
    average: d.average,
    completed: d.completed,
  }));

  // Prepare comparison chart data
  const comparisonChartData = comparison ? comparison.current.categoryScores.map((cat, idx) => ({
    category: cat.label,
    current: cat.score,
    comparison: comparison.comparison.categoryScores[idx]?.score || 0,
  })) : [];

  const periodLabel = periodOptions.find(p => p.value === filters.period)?.label || "Toutes les périodes";
  const languageLabel = languageOptions.find(l => l.value === filters.language)?.label || "Toutes les langues";

  const exportButton = (
    <Button
      onClick={() => generateQualioPDF(stats, periodLabel, languageLabel)}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      Exporter PDF Qualiopi
    </Button>
  );

  const overviewFilters = (
    <>
      <Select
        value={filters.period}
        onValueChange={(value: PeriodFilter) => setFilters(prev => ({ ...prev, period: value }))}
      >
        <SelectTrigger className="w-[180px]" aria-label="Période">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.language}
        onValueChange={(value: LanguageFilter) => setFilters(prev => ({ ...prev, language: value }))}
      >
        <SelectTrigger className="w-[180px]" aria-label="Langue">
          <Languages className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Langue" />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  const comparisonKPIs: Array<{
    title: string;
    currentValue: number;
    comparisonValue: number;
    delta: number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: TileTone;
  }> = comparison
    ? [
        {
          title: "Questionnaires complétés",
          currentValue: comparison.current.completedSurveys,
          comparisonValue: comparison.comparison.completedSurveys,
          delta: comparison.deltas.completedSurveys,
          unit: "",
          icon: Users,
          tone: "gold",
        },
        {
          title: "Taux de réponse",
          currentValue: comparison.current.responseRate,
          comparisonValue: comparison.comparison.responseRate,
          delta: comparison.deltas.responseRate,
          unit: "%",
          icon: Target,
          tone: "blue",
        },
        {
          title: "Note moyenne",
          currentValue: comparison.current.averageScore,
          comparisonValue: comparison.comparison.averageScore,
          delta: comparison.deltas.averageScore,
          unit: "/5",
          icon: Star,
          tone: "teal",
        },
        {
          title: "Taux de satisfaction",
          currentValue: comparison.current.satisfactionRate,
          comparisonValue: comparison.comparison.satisfactionRate,
          delta: comparison.deltas.satisfactionRate,
          unit: "%",
          icon: Award,
          tone: "purple",
        },
      ]
    : [];

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Statistiques de Satisfaction"
          description="Indicateurs Qualiopi et analyse des retours stagiaires"
          icon={Star}
          tone="gold"
          meta={
            activeTab === "overview" ? (
              <>
                <StatusPill tone="info" icon={Calendar}>{periodLabel}</StatusPill>
                <StatusPill tone="neutral" icon={Languages}>{languageLabel}</StatusPill>
              </>
            ) : (
              <StatusPill tone="neutral" icon={Languages}>
                {languageOptions.find(l => l.value === comparisonFilters.language)?.label ?? "Toutes les langues"}
              </StatusPill>
            )
          }
          actions={
            <>
              {activeTab === "overview" && overviewFilters}
              {exportButton}
            </>
          }
          tabs={tabs}
        />

        {activeTab === "overview" ? (
          <>
            {/* KPI Cards */}
            <StatTileGrid cols={4}>
              <StatTile
                label="Questionnaires envoyés"
                value={stats.totalSurveys}
                hint={`${stats.completedSurveys} complétés`}
                icon={Users}
                tone="gold"
              />
              <StatTile
                label="Taux de réponse"
                value={`${stats.responseRate.toFixed(1)}%`}
                hint="Objectif Qualiopi: 50%"
                icon={Target}
                tone="blue"
              >
                <TrendPill
                  trend={stats.responseRate >= 50 ? "up" : "down"}
                  label={stats.responseRate >= 50 ? "Objectif atteint" : "Sous l'objectif"}
                />
              </StatTile>
              <StatTile
                label="Note moyenne"
                value={`${stats.averageScores.overall.toFixed(2)}/5`}
                hint="Sur tous les critères"
                icon={Star}
                tone="teal"
              >
                <TrendPill
                  trend={stats.qualiopiIndicators.trend}
                  label={
                    stats.qualiopiIndicators.trend === "up"
                      ? "En hausse"
                      : stats.qualiopiIndicators.trend === "down"
                        ? "En baisse"
                        : "Stable"
                  }
                />
              </StatTile>
              <StatTile
                label="Taux de satisfaction"
                value={`${stats.qualiopiIndicators.satisfactionRate.toFixed(1)}%`}
                hint="Note ≥ 3.5/5"
                icon={Award}
                tone="purple"
              >
                <TrendPill
                  trend={stats.qualiopiIndicators.satisfactionRate >= 80 ? "up" : "stable"}
                  label={stats.qualiopiIndicators.satisfactionRate >= 80 ? "Objectif atteint" : "Stable"}
                />
              </StatTile>
            </StatTileGrid>

            {/* Qualiopi Indicators */}
            <SurfaceCard
              title="Indicateurs Qualiopi"
              description="Suivi des objectifs qualité selon le référentiel national"
              icon={CheckCircle2}
            >
              <div className="space-y-5">
                <QualiopiIndicator
                  label="Taux de réponse aux questionnaires"
                  value={stats.responseRate}
                  target={50}
                />
                <QualiopiIndicator
                  label="Taux de satisfaction globale"
                  value={stats.qualiopiIndicators.satisfactionRate}
                  target={80}
                />
                <QualiopiIndicator
                  label="Note moyenne de satisfaction"
                  value={stats.averageScores.overall}
                  target={3.5}
                  unit="/5"
                />
              </div>
            </SurfaceCard>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Évolution mensuelle — deux échelles, donc deux graphiques empilés. */}
              <SurfaceCard
                title="Évolution mensuelle"
                description="Note moyenne et nombre de réponses par mois — deux échelles, deux graphiques"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <SectionHeading title="Note moyenne (sur 5)" />
                    <TrendChart
                      data={monthlyChartData}
                      series={[{ key: "average", label: "Note moyenne" }]}
                      xKey="label"
                      variant="line"
                      height={180}
                      formatValue={(value) => `${Number(value).toFixed(2)}/5`}
                      yDomain={[0, 5]}
                      ariaLabel="Note moyenne de satisfaction par mois, sur 5"
                      emptyMessage="Aucune réponse sur la période"
                    />
                  </div>
                  <div className="space-y-2">
                    <SectionHeading title="Réponses reçues" />
                    <BarsChart
                      data={monthlyChartData}
                      series={[{ key: "completed", label: "Réponses", color: seriesColor(1) }]}
                      xKey="label"
                      height={180}
                      formatValue={(value) => `${value}`}
                      ariaLabel="Nombre de questionnaires complétés par mois"
                      emptyMessage="Aucune réponse sur la période"
                    />
                  </div>
                </div>
              </SurfaceCard>

              {/* Radar — pas d'équivalent kit : recharts brut, habillé aux jetons. */}
              <SurfaceCard
                title="Notes par critère"
                description="Analyse des 7 dimensions de satisfaction"
                icon={LineChartIcon}
              >
                <ChartFrame height={300} ariaLabel="Notes moyennes par critère de satisfaction, de 0 à 5">
                  <RadarChart data={stats.categoryBreakdown}>
                    <PolarGrid stroke={CHART_CHROME.grid} />
                    <PolarAngleAxis
                      dataKey="label"
                      tick={{ fill: CHART_CHROME.axis, fontSize: 12 }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fill: CHART_CHROME.axis, fontSize: 11 }}
                      stroke={axisProps.stroke}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={seriesColor(0)}
                      strokeWidth={2}
                      fill={seriesColor(0)}
                      fillOpacity={0.28}
                    />
                    <Tooltip content={scoreTooltip} />
                  </RadarChart>
                </ChartFrame>
              </SurfaceCard>
            </div>

            {/* Bar Chart - Category Breakdown */}
            <SurfaceCard
              title="Détail par critère"
              description="Comparaison des notes moyennes par dimension"
              icon={BarChart3}
            >
              <BarsChart
                data={stats.categoryBreakdown}
                series={[{ key: "score", label: "Score" }]}
                xKey="label"
                layout="horizontal"
                height={300}
                formatValue={(value) => `${Number(value).toFixed(2)}/5`}
                ariaLabel="Note moyenne par critère de satisfaction"
                emptyMessage="Aucune donnée sur la période"
              />
            </SurfaceCard>

            {/* Recent Feedback */}
            <SurfaceCard
              title="Retours récents"
              description="Points forts et axes d'amélioration mentionnés"
              icon={MessageSquare}
            >
              {stats.recentFeedback.length === 0 ? (
                <TableEmpty
                  icon={MessageSquare}
                  title="Aucun questionnaire complété pour le moment"
                  description="Les verbatims des stagiaires apparaîtront ici dès la première réponse."
                />
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-3">
                    {stats.recentFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="space-y-2 rounded-[var(--radius)] border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm text-muted-foreground tabular">
                            {format(new Date(feedback.completedAt), "d MMMM yyyy", { locale: fr })}
                          </span>
                          <StatusPill
                            tone={
                              feedback.averageScore >= 4
                                ? "success"
                                : feedback.averageScore >= 3
                                  ? "warning"
                                  : "danger"
                            }
                            size="sm"
                          >
                            {feedback.averageScore.toFixed(1)}/5
                          </StatusPill>
                        </div>
                        {feedback.strongPoints && (
                          <div>
                            <span className="text-xs font-medium text-[hsl(var(--status-good))]">
                              Points forts:
                            </span>
                            <p className="text-sm">{feedback.strongPoints}</p>
                          </div>
                        )}
                        {feedback.weakPoints && (
                          <div>
                            <span className="text-xs font-medium text-[hsl(var(--status-warning))]">
                              Axes d'amélioration:
                            </span>
                            <p className="text-sm">{feedback.weakPoints}</p>
                          </div>
                        )}
                        {!feedback.strongPoints && !feedback.weakPoints && (
                          <p className="text-sm italic text-muted-foreground">
                            Pas de commentaire textuel
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </SurfaceCard>
          </>
        ) : (
          <>
            {/* Périodes comparées + filtres de la comparaison */}
            <SurfaceCard
              title="Périodes comparées"
              description="Choisissez les deux périodes et la langue à comparer"
              icon={GitCompare}
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Période actuelle</span>
                  <Select
                    value={comparisonFilters.currentSeason}
                    onValueChange={(value: SeasonFilter) => setComparisonFilters(prev => ({ ...prev, currentSeason: value }))}
                  >
                    <SelectTrigger className="w-[200px]" aria-label="Période actuelle">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Période actuelle" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasonOptions.filter(o => o.value !== "all").map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {comparisonFilters.currentSeason === "custom" && (
                  <DateRangePicker
                    label="Dates période actuelle"
                    dateRange={comparisonFilters.customCurrentRange || { start: null, end: null }}
                    onDateRangeChange={(range) => setComparisonFilters(prev => ({ ...prev, customCurrentRange: range }))}
                  />
                )}

                <span className="flex items-center pb-2 text-muted-foreground">vs</span>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Période comparée</span>
                  <Select
                    value={comparisonFilters.comparisonSeason}
                    onValueChange={(value: SeasonFilter) => setComparisonFilters(prev => ({ ...prev, comparisonSeason: value }))}
                  >
                    <SelectTrigger className="w-[200px]" aria-label="Période comparée">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Période comparée" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasonOptions.filter(o => o.value !== "all").map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {comparisonFilters.comparisonSeason === "custom" && (
                  <DateRangePicker
                    label="Dates période comparée"
                    dateRange={comparisonFilters.customComparisonRange || { start: null, end: null }}
                    onDateRangeChange={(range) => setComparisonFilters(prev => ({ ...prev, customComparisonRange: range }))}
                  />
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Langue</span>
                  <Select
                    value={comparisonFilters.language}
                    onValueChange={(value: LanguageFilter) => setComparisonFilters(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="w-[180px]" aria-label="Langue comparée">
                      <Languages className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Langue" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {comparison && (
                <div className="mt-5 flex flex-col items-center justify-center gap-4 rounded-[var(--radius)] bg-[hsl(var(--surface-sunken))] p-4 sm:flex-row">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Période actuelle</p>
                    <p className="text-lg font-semibold">{comparison.current.label}</p>
                  </div>
                  <GitCompare className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Période comparée</p>
                    <p className="text-lg font-semibold">{comparison.comparison.label}</p>
                  </div>
                </div>
              )}
            </SurfaceCard>

            {isLoadingComparison ? (
              <div className="space-y-4">
                <StatTileGrid cols={4}>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-[var(--radius-card)]" />
                  ))}
                </StatTileGrid>
                <Skeleton className="h-80 rounded-[var(--radius-card)]" />
              </div>
            ) : comparison ? (
              <>
                {/* Comparison KPI Cards */}
                <StatTileGrid cols={4}>
                  {comparisonKPIs.map((kpi) => (
                    <StatTile
                      key={kpi.title}
                      label={kpi.title}
                      value={`${kpi.currentValue.toFixed(1)}${kpi.unit}`}
                      hint={`vs ${kpi.comparisonValue.toFixed(1)}${kpi.unit} période précédente`}
                      icon={kpi.icon}
                      tone={kpi.tone}
                    >
                      <DeltaIndicator value={kpi.delta} unit={kpi.unit} />
                    </StatTile>
                  ))}
                </StatTileGrid>

                {/* Comparison Chart */}
                <SurfaceCard
                  title="Comparaison par critère"
                  description={`${comparison.current.label} vs ${comparison.comparison.label}`}
                  icon={BarChart3}
                >
                  <BarsChart
                    data={comparisonChartData}
                    series={[
                      { key: "current", label: comparison.current.label },
                      { key: "comparison", label: comparison.comparison.label },
                    ]}
                    xKey="category"
                    layout="horizontal"
                    height={350}
                    formatValue={(value) => `${Number(value).toFixed(2)}/5`}
                    ariaLabel={`Notes par critère : ${comparison.current.label} contre ${comparison.comparison.label}`}
                    emptyMessage="Aucune donnée sur les périodes choisies"
                  />
                </SurfaceCard>

                {/* Radar Comparison */}
                <SurfaceCard
                  title="Vue radar comparative"
                  description="Superposition des profils de satisfaction"
                  icon={LineChartIcon}
                >
                  <div className="space-y-3">
                    <ChartFrame
                      height={350}
                      ariaLabel={`Profils de satisfaction comparés : ${comparison.current.label} et ${comparison.comparison.label}`}
                    >
                      <RadarChart data={comparisonChartData}>
                        <PolarGrid stroke={CHART_CHROME.grid} />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fill: CHART_CHROME.axis, fontSize: 12 }}
                          tickLine={false}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 5]}
                          tick={{ fill: CHART_CHROME.axis, fontSize: 11 }}
                          stroke={axisProps.stroke}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Radar
                          name={comparison.current.label}
                          dataKey="current"
                          stroke={seriesColor(0)}
                          strokeWidth={2}
                          fill={seriesColor(0)}
                          fillOpacity={0.28}
                        />
                        <Radar
                          name={comparison.comparison.label}
                          dataKey="comparison"
                          stroke={seriesColor(1)}
                          strokeWidth={2}
                          fill={seriesColor(1)}
                          fillOpacity={0.2}
                        />
                        <Tooltip content={scoreTooltip} />
                      </RadarChart>
                    </ChartFrame>
                    <ChartLegend
                      items={[
                        { key: "current", label: comparison.current.label, color: seriesColor(0) },
                        { key: "comparison", label: comparison.comparison.label, color: seriesColor(1) },
                      ]}
                    />
                  </div>
                </SurfaceCard>

                {/* Delta Summary */}
                <SurfaceCard
                  title="Résumé des évolutions"
                  description="Variation entre les deux périodes"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {comparison.current.categoryScores.map((cat, idx) => {
                      const comparisonScore = comparison.comparison.categoryScores[idx]?.score || 0;
                      const delta = cat.score - comparisonScore;
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border p-3"
                        >
                          <span className="min-w-0 truncate font-medium">{cat.label}</span>
                          <DeltaIndicator value={delta} unit="/5" />
                        </div>
                      );
                    })}
                  </div>
                </SurfaceCard>
              </>
            ) : (
              <SurfaceCard>
                <TableEmpty
                  icon={GitCompare}
                  title="Sélectionnez deux périodes à comparer"
                  description="Choisissez une période actuelle et une période de référence ci-dessus."
                />
              </SurfaceCard>
            )}
          </>
        )}
      </PageShell>
    </MainLayout>
  );
}

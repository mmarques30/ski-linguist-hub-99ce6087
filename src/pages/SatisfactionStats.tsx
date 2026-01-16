import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
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
  FileDown
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className = ""
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "stable";
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={`flex items-center ${
              trend === "up" ? "text-green-500" : 
              trend === "down" ? "text-red-500" : 
              "text-muted-foreground"
            }`}>
              {trend === "up" && <TrendingUp className="h-4 w-4" />}
              {trend === "down" && <TrendingDown className="h-4 w-4" />}
              {trend === "stable" && <Minus className="h-4 w-4" />}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QualiopiIndicator({ label, value, target, unit = "%" }: { 
  label: string; 
  value: number; 
  target: number;
  unit?: string;
}) {
  const isAboveTarget = value >= target;
  const percentage = Math.min((value / target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isAboveTarget ? "text-green-600" : "text-amber-600"}`}>
            {value.toFixed(1)}{unit}
          </span>
          <Badge variant={isAboveTarget ? "default" : "secondary"} className="text-xs">
            Objectif: {target}{unit}
          </Badge>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${isAboveTarget ? "bg-green-500" : "bg-amber-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
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
  
  yPos += 10;
  
  // Section: Points forts (verbatims)
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
  { value: "Portugais", label: "Portugais" },
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

function DeltaIndicator({ value, unit = "", positiveIsGood = true }: { value: number; unit?: string; positiveIsGood?: boolean }) {
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  
  if (Math.abs(value) < 0.01) {
    return (
      <span className="text-muted-foreground text-sm flex items-center gap-1">
        <Minus className="h-3 w-3" />
        stable
      </span>
    );
  }
  
  return (
    <span className={`text-sm flex items-center gap-1 ${isGood ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}{unit}
    </span>
  );
}

function ComparisonCard({ 
  title, 
  currentValue, 
  comparisonValue, 
  delta, 
  unit = "",
  icon: Icon,
  positiveIsGood = true 
}: { 
  title: string;
  currentValue: number;
  comparisonValue: number;
  delta: number;
  unit?: string;
  icon: React.ElementType;
  positiveIsGood?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{currentValue.toFixed(1)}{unit}</span>
          <DeltaIndicator value={delta} unit={unit} positiveIsGood={positiveIsGood} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs {comparisonValue.toFixed(1)}{unit} période précédente
        </p>
      </CardContent>
    </Card>
  );
}

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
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

  // Prepare comparison chart data
  const comparisonChartData = comparison ? comparison.current.categoryScores.map((cat, idx) => ({
    category: cat.label,
    current: cat.score,
    comparison: comparison.comparison.categoryScores[idx]?.score || 0,
  })) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistiques de Satisfaction</h1>
            <p className="text-muted-foreground">
              Indicateurs Qualiopi et analyse des retours stagiaires
            </p>
          </div>
          <Button
            onClick={() => {
              const periodLabel = periodOptions.find(p => p.value === filters.period)?.label || "Toutes les périodes";
              const languageLabel = languageOptions.find(l => l.value === filters.language)?.label || "Toutes les langues";
              generateQualioPDF(stats, periodLabel, languageLabel);
            }}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exporter PDF Qualiopi
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "comparison")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <Target className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2">
                <GitCompare className="h-4 w-4" />
                Comparaison
              </TabsTrigger>
            </TabsList>
            
            {/* Filters for overview tab */}
            {activeTab === "overview" && (
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={filters.period} 
                  onValueChange={(value: PeriodFilter) => setFilters(prev => ({ ...prev, period: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-[180px]">
                    <Languages className="h-4 w-4 mr-2" />
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
            )}
            
            {/* Filters for comparison tab */}
            {activeTab === "comparison" && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Période actuelle</span>
                  <Select 
                    value={comparisonFilters.currentSeason} 
                    onValueChange={(value: SeasonFilter) => setComparisonFilters(prev => ({ ...prev, currentSeason: value }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <Calendar className="h-4 w-4 mr-2" />
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
                
                <span className="flex items-center text-muted-foreground pb-2">vs</span>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Période comparée</span>
                  <Select 
                    value={comparisonFilters.comparisonSeason} 
                    onValueChange={(value: SeasonFilter) => setComparisonFilters(prev => ({ ...prev, comparisonSeason: value }))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <Calendar className="h-4 w-4 mr-2" />
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
                    <SelectTrigger className="w-[180px]">
                      <Languages className="h-4 w-4 mr-2" />
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
            )}
          </div>

          <TabsContent value="overview" className="space-y-6 mt-6">

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Questionnaires envoyés"
            value={stats.totalSurveys}
            subtitle={`${stats.completedSurveys} complétés`}
            icon={Users}
          />
          <StatCard
            title="Taux de réponse"
            value={`${stats.responseRate.toFixed(1)}%`}
            subtitle="Objectif Qualiopi: 50%"
            icon={Target}
            trend={stats.responseRate >= 50 ? "up" : "down"}
          />
          <StatCard
            title="Note moyenne"
            value={`${stats.averageScores.overall.toFixed(2)}/5`}
            subtitle="Sur tous les critères"
            icon={Star}
            trend={stats.qualiopiIndicators.trend}
          />
          <StatCard
            title="Taux de satisfaction"
            value={`${stats.qualiopiIndicators.satisfactionRate.toFixed(1)}%`}
            subtitle="Note ≥ 3.5/5"
            icon={Award}
            trend={stats.qualiopiIndicators.satisfactionRate >= 80 ? "up" : "stable"}
          />
        </div>

        {/* Qualiopi Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Indicateurs Qualiopi
            </CardTitle>
            <CardDescription>
              Suivi des objectifs qualité selon le référentiel national
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
              <CardDescription>Note moyenne et nombre de réponses par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => monthLabels[value] || value}
                    className="text-xs"
                  />
                  <YAxis yAxisId="left" domain={[0, 5]} className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => monthLabels[value as string] || value}
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="average" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Note moyenne"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="completed" 
                    fill="hsl(var(--muted-foreground))" 
                    opacity={0.3}
                    name="Réponses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Notes par critère</CardTitle>
              <CardDescription>Analyse des 7 dimensions de satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={stats.categoryBreakdown}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="label" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} className="text-xs" />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => [`${value.toFixed(2)}/5`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart - Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Détail par critère</CardTitle>
            <CardDescription>Comparaison des notes moyennes par dimension</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 5]} className="text-xs" />
                <YAxis type="category" dataKey="label" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number) => [`${value.toFixed(2)}/5`, "Score"]}
                />
                <Bar 
                  dataKey="score" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Retours récents
            </CardTitle>
            <CardDescription>Points forts et axes d'amélioration mentionnés</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {stats.recentFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun questionnaire complété pour le moment
                  </p>
                ) : (
                  stats.recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(feedback.completedAt), "d MMMM yyyy", { locale: fr })}
                        </span>
                        <Badge variant={feedback.averageScore >= 4 ? "default" : feedback.averageScore >= 3 ? "secondary" : "destructive"}>
                          {feedback.averageScore.toFixed(1)}/5
                        </Badge>
                      </div>
                      {feedback.strongPoints && (
                        <div>
                          <span className="text-xs font-medium text-green-600">Points forts:</span>
                          <p className="text-sm">{feedback.strongPoints}</p>
                        </div>
                      )}
                      {feedback.weakPoints && (
                        <div>
                          <span className="text-xs font-medium text-amber-600">Axes d'amélioration:</span>
                          <p className="text-sm">{feedback.weakPoints}</p>
                        </div>
                      )}
                      {!feedback.strongPoints && !feedback.weakPoints && (
                        <p className="text-sm text-muted-foreground italic">
                          Pas de commentaire textuel
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6 mt-6">
            {isLoadingComparison ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
                <Skeleton className="h-80" />
              </div>
            ) : comparison ? (
              <>
                {/* Comparison Header */}
                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Période actuelle</p>
                    <p className="text-lg font-semibold">{comparison.current.label}</p>
                  </div>
                  <GitCompare className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Période comparée</p>
                    <p className="text-lg font-semibold">{comparison.comparison.label}</p>
                  </div>
                </div>

                {/* Comparison KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <ComparisonCard
                    title="Questionnaires complétés"
                    currentValue={comparison.current.completedSurveys}
                    comparisonValue={comparison.comparison.completedSurveys}
                    delta={comparison.deltas.completedSurveys}
                    icon={Users}
                  />
                  <ComparisonCard
                    title="Taux de réponse"
                    currentValue={comparison.current.responseRate}
                    comparisonValue={comparison.comparison.responseRate}
                    delta={comparison.deltas.responseRate}
                    unit="%"
                    icon={Target}
                  />
                  <ComparisonCard
                    title="Note moyenne"
                    currentValue={comparison.current.averageScore}
                    comparisonValue={comparison.comparison.averageScore}
                    delta={comparison.deltas.averageScore}
                    unit="/5"
                    icon={Star}
                  />
                  <ComparisonCard
                    title="Taux de satisfaction"
                    currentValue={comparison.current.satisfactionRate}
                    comparisonValue={comparison.comparison.satisfactionRate}
                    delta={comparison.deltas.satisfactionRate}
                    unit="%"
                    icon={Award}
                  />
                </div>

                {/* Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison par critère</CardTitle>
                    <CardDescription>
                      {comparison.current.label} vs {comparison.comparison.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={comparisonChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 5]} className="text-xs" />
                        <YAxis type="category" dataKey="category" width={100} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                          formatter={(value: number) => [`${value.toFixed(2)}/5`]}
                        />
                        <Legend />
                        <Bar 
                          dataKey="current" 
                          fill="hsl(var(--primary))"
                          name={comparison.current.label}
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                          dataKey="comparison" 
                          fill="hsl(var(--muted-foreground))"
                          name={comparison.comparison.label}
                          radius={[0, 4, 4, 0]}
                          opacity={0.6}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Radar Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vue radar comparative</CardTitle>
                    <CardDescription>Superposition des profils de satisfaction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={comparisonChartData}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis dataKey="category" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} className="text-xs" />
                        <Radar
                          name={comparison.current.label}
                          dataKey="current"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name={comparison.comparison.label}
                          dataKey="comparison"
                          stroke="hsl(var(--muted-foreground))"
                          fill="hsl(var(--muted-foreground))"
                          fillOpacity={0.2}
                        />
                        <Legend />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                          formatter={(value: number) => [`${value.toFixed(2)}/5`]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Delta Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé des évolutions</CardTitle>
                    <CardDescription>Variation entre les deux périodes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {comparison.current.categoryScores.map((cat, idx) => {
                        const comparisonScore = comparison.comparison.categoryScores[idx]?.score || 0;
                        const delta = cat.score - comparisonScore;
                        return (
                          <div key={cat.category} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{cat.label}</span>
                            <DeltaIndicator value={delta} unit="/5" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sélectionnez deux périodes à comparer
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

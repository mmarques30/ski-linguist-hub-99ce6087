import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSatisfactionStats, SatisfactionFilters, PeriodFilter, LanguageFilter } from "@/hooks/useSatisfactionStats";
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
  Languages
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function SatisfactionStats() {
  const [filters, setFilters] = useState<SatisfactionFilters>({
    period: "all",
    language: "all",
  });
  
  const { data: stats, isLoading } = useSatisfactionStats(filters);

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
          
          {/* Filters */}
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
        </div>

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
      </div>
    </MainLayout>
  );
}

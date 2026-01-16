import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";

interface SatisfactionSurvey {
  id: string;
  inscription_id: string;
  student_id: string;
  completed_at: string | null;
  created_at: string;
  satisfaction_content: number | null;
  satisfaction_animation: number | null;
  satisfaction_duration: number | null;
  satisfaction_utility: number | null;
  satisfaction_materials: number | null;
  satisfaction_organization: number | null;
  satisfaction_expectations: number | null;
  strong_points: string | null;
  weak_points: string | null;
  inscription?: {
    language: string | null;
  };
}

export type PeriodFilter = "all" | "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "lastYear" | "last3Months" | "last6Months" | "last12Months";
export type SeasonFilter = "all" | "spring2024" | "summer2024" | "autumn2024" | "winter2024" | "spring2025" | "summer2025" | "autumn2025" | "winter2025";
export type LanguageFilter = "all" | "Anglais" | "Espagnol" | "Français" | "Allemand" | "Italien" | "Portugais";

export interface SatisfactionFilters {
  period: PeriodFilter;
  language: LanguageFilter;
  comparisonPeriod?: PeriodFilter;
}

export interface SeasonComparisonFilters {
  currentSeason: SeasonFilter;
  comparisonSeason: SeasonFilter;
  language: LanguageFilter;
}

function getSeasonDateRange(season: SeasonFilter): { start: Date | null; end: Date | null } {
  switch (season) {
    case "spring2024":
      return { start: new Date(2024, 2, 1), end: new Date(2024, 4, 31) }; // Mar-May 2024
    case "summer2024":
      return { start: new Date(2024, 5, 1), end: new Date(2024, 7, 31) }; // Jun-Aug 2024
    case "autumn2024":
      return { start: new Date(2024, 8, 1), end: new Date(2024, 10, 30) }; // Sep-Nov 2024
    case "winter2024":
      return { start: new Date(2024, 11, 1), end: new Date(2025, 1, 28) }; // Dec 2024 - Feb 2025
    case "spring2025":
      return { start: new Date(2025, 2, 1), end: new Date(2025, 4, 31) }; // Mar-May 2025
    case "summer2025":
      return { start: new Date(2025, 5, 1), end: new Date(2025, 7, 31) }; // Jun-Aug 2025
    case "autumn2025":
      return { start: new Date(2025, 8, 1), end: new Date(2025, 10, 30) }; // Sep-Nov 2025
    case "winter2025":
      return { start: new Date(2025, 11, 1), end: new Date(2026, 1, 28) }; // Dec 2025 - Feb 2026
    case "all":
    default:
      return { start: null, end: null };
  }
}

function getDateRange(period: PeriodFilter): { start: Date | null; end: Date | null } {
  const now = new Date();
  
  switch (period) {
    case "thisMonth":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "lastMonth":
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case "thisQuarter":
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "lastQuarter":
      return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
    case "thisYear":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "lastYear":
      return { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
    case "last3Months":
      return { start: subMonths(now, 3), end: now };
    case "last6Months":
      return { start: subMonths(now, 6), end: now };
    case "last12Months":
      return { start: subMonths(now, 12), end: now };
    case "all":
    default:
      return { start: null, end: null };
  }
}

interface SatisfactionStats {
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
  monthlyData: {
    month: string;
    completed: number;
    average: number;
  }[];
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
  qualiopiIndicators: {
    satisfactionRate: number;
    responseRate: number;
    averageScore: number;
    trend: "up" | "down" | "stable";
  };
}

export interface SeasonComparisonStats {
  current: {
    label: string;
    totalSurveys: number;
    completedSurveys: number;
    responseRate: number;
    averageScore: number;
    satisfactionRate: number;
    categoryScores: { category: string; label: string; score: number }[];
  };
  comparison: {
    label: string;
    totalSurveys: number;
    completedSurveys: number;
    responseRate: number;
    averageScore: number;
    satisfactionRate: number;
    categoryScores: { category: string; label: string; score: number }[];
  };
  deltas: {
    responseRate: number;
    averageScore: number;
    satisfactionRate: number;
    completedSurveys: number;
  };
}

export function useSatisfactionStats(filters?: SatisfactionFilters) {
  const period = filters?.period || "all";
  const language = filters?.language || "all";
  
  return useQuery({
    queryKey: ["satisfaction-stats", period, language],
    queryFn: async (): Promise<SatisfactionStats> => {
      const { data: surveys, error } = await supabase
        .from("satisfaction_surveys")
        .select(`
          *,
          inscription:inscriptions(language)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let typedSurveys = surveys as SatisfactionSurvey[];
      
      // Apply language filter
      if (language !== "all") {
        typedSurveys = typedSurveys.filter((s) => s.inscription?.language === language);
      }
      
      // Apply period filter
      const { start, end } = getDateRange(period);
      if (start && end) {
        typedSurveys = typedSurveys.filter((s) => {
          const date = s.completed_at ? new Date(s.completed_at) : new Date(s.created_at);
          return date >= start && date <= end;
        });
      }
      const completedSurveys = typedSurveys.filter((s) => s.completed_at !== null);
      const totalSurveys = typedSurveys.length;
      const responseRate = totalSurveys > 0 ? (completedSurveys.length / totalSurveys) * 100 : 0;

      // Calculate average scores
      const calculateAverage = (field: keyof SatisfactionSurvey) => {
        const values = completedSurveys
          .map((s) => s[field] as number | null)
          .filter((v): v is number => v !== null);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      };

      const averageScores = {
        content: calculateAverage("satisfaction_content"),
        animation: calculateAverage("satisfaction_animation"),
        duration: calculateAverage("satisfaction_duration"),
        utility: calculateAverage("satisfaction_utility"),
        materials: calculateAverage("satisfaction_materials"),
        organization: calculateAverage("satisfaction_organization"),
        expectations: calculateAverage("satisfaction_expectations"),
        overall: 0,
      };

      const allScores = Object.values(averageScores).filter((v) => v > 0);
      averageScores.overall = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

      // Monthly data for chart
      const monthlyMap = new Map<string, { completed: number; total: number; sum: number }>();
      
      completedSurveys.forEach((survey) => {
        const date = new Date(survey.completed_at!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        const scores = [
          survey.satisfaction_content,
          survey.satisfaction_animation,
          survey.satisfaction_duration,
          survey.satisfaction_utility,
          survey.satisfaction_materials,
          survey.satisfaction_organization,
          survey.satisfaction_expectations,
        ].filter((s): s is number => s !== null);
        
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        const existing = monthlyMap.get(monthKey) || { completed: 0, total: 0, sum: 0 };
        monthlyMap.set(monthKey, {
          completed: existing.completed + 1,
          total: existing.total + 1,
          sum: existing.sum + avgScore,
        });
      });

      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          completed: data.completed,
          average: data.total > 0 ? Math.round((data.sum / data.total) * 10) / 10 : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);

      // Category breakdown for radar/bar chart
      const categoryBreakdown = [
        { category: "content", score: averageScores.content, label: "Contenu" },
        { category: "animation", score: averageScores.animation, label: "Animation" },
        { category: "duration", score: averageScores.duration, label: "Durée" },
        { category: "utility", score: averageScores.utility, label: "Utilité" },
        { category: "materials", score: averageScores.materials, label: "Supports" },
        { category: "organization", score: averageScores.organization, label: "Organisation" },
        { category: "expectations", score: averageScores.expectations, label: "Attentes" },
      ];

      // Recent feedback
      const recentFeedback = completedSurveys.slice(0, 10).map((survey) => {
        const scores = [
          survey.satisfaction_content,
          survey.satisfaction_animation,
          survey.satisfaction_duration,
          survey.satisfaction_utility,
          survey.satisfaction_materials,
          survey.satisfaction_organization,
          survey.satisfaction_expectations,
        ].filter((s): s is number => s !== null);
        
        return {
          id: survey.id,
          completedAt: survey.completed_at!,
          averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          strongPoints: survey.strong_points,
          weakPoints: survey.weak_points,
        };
      });

      // Qualiopi indicators
      const last3Months = completedSurveys.filter((s) => {
        const date = new Date(s.completed_at!);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date >= threeMonthsAgo;
      });

      const previous3Months = completedSurveys.filter((s) => {
        const date = new Date(s.completed_at!);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return date >= sixMonthsAgo && date < threeMonthsAgo;
      });

      const currentAvg = last3Months.length > 0
        ? last3Months.reduce((sum, s) => {
            const scores = [s.satisfaction_content, s.satisfaction_animation, s.satisfaction_duration, s.satisfaction_utility, s.satisfaction_materials, s.satisfaction_organization, s.satisfaction_expectations].filter((v): v is number => v !== null);
            return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
          }, 0) / last3Months.length
        : 0;

      const previousAvg = previous3Months.length > 0
        ? previous3Months.reduce((sum, s) => {
            const scores = [s.satisfaction_content, s.satisfaction_animation, s.satisfaction_duration, s.satisfaction_utility, s.satisfaction_materials, s.satisfaction_organization, s.satisfaction_expectations].filter((v): v is number => v !== null);
            return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
          }, 0) / previous3Months.length
        : 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (currentAvg > previousAvg + 0.1) trend = "up";
      else if (currentAvg < previousAvg - 0.1) trend = "down";

      const satisfactionRate = completedSurveys.length > 0
        ? (completedSurveys.filter((s) => {
            const scores = [s.satisfaction_content, s.satisfaction_animation, s.satisfaction_duration, s.satisfaction_utility, s.satisfaction_materials, s.satisfaction_organization, s.satisfaction_expectations].filter((v): v is number => v !== null);
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            return avg >= 3.5;
          }).length / completedSurveys.length) * 100
        : 0;

      return {
        totalSurveys,
        completedSurveys: completedSurveys.length,
        responseRate,
        averageScores,
        monthlyData,
        categoryBreakdown,
        recentFeedback,
        qualiopiIndicators: {
          satisfactionRate,
          responseRate,
          averageScore: averageScores.overall,
          trend,
        },
      };
    },
  });
}

const SEASON_LABELS: Record<SeasonFilter, string> = {
  all: "Toutes les périodes",
  spring2024: "Printemps 2024",
  summer2024: "Été 2024",
  autumn2024: "Automne 2024",
  winter2024: "Hiver 2024/25",
  spring2025: "Printemps 2025",
  summer2025: "Été 2025",
  autumn2025: "Automne 2025",
  winter2025: "Hiver 2025/26",
};

function calculatePeriodStats(surveys: SatisfactionSurvey[], start: Date | null, end: Date | null) {
  let filtered = surveys;
  
  if (start && end) {
    filtered = surveys.filter((s) => {
      const date = s.completed_at ? new Date(s.completed_at) : new Date(s.created_at);
      return date >= start && date <= end;
    });
  }
  
  const completed = filtered.filter((s) => s.completed_at !== null);
  const total = filtered.length;
  const responseRate = total > 0 ? (completed.length / total) * 100 : 0;
  
  const calculateCategoryAvg = (field: keyof SatisfactionSurvey) => {
    const values = completed
      .map((s) => s[field] as number | null)
      .filter((v): v is number => v !== null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };
  
  const categoryScores = [
    { category: "content", label: "Contenu", score: calculateCategoryAvg("satisfaction_content") },
    { category: "animation", label: "Animation", score: calculateCategoryAvg("satisfaction_animation") },
    { category: "duration", label: "Durée", score: calculateCategoryAvg("satisfaction_duration") },
    { category: "utility", label: "Utilité", score: calculateCategoryAvg("satisfaction_utility") },
    { category: "materials", label: "Supports", score: calculateCategoryAvg("satisfaction_materials") },
    { category: "organization", label: "Organisation", score: calculateCategoryAvg("satisfaction_organization") },
    { category: "expectations", label: "Attentes", score: calculateCategoryAvg("satisfaction_expectations") },
  ];
  
  const allScores = categoryScores.map(c => c.score).filter(v => v > 0);
  const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  
  const satisfactionRate = completed.length > 0
    ? (completed.filter((s) => {
        const scores = [s.satisfaction_content, s.satisfaction_animation, s.satisfaction_duration, s.satisfaction_utility, s.satisfaction_materials, s.satisfaction_organization, s.satisfaction_expectations].filter((v): v is number => v !== null);
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return avg >= 3.5;
      }).length / completed.length) * 100
    : 0;
  
  return {
    totalSurveys: total,
    completedSurveys: completed.length,
    responseRate,
    averageScore,
    satisfactionRate,
    categoryScores,
  };
}

export function useSeasonComparison(filters: SeasonComparisonFilters) {
  const { currentSeason, comparisonSeason, language } = filters;
  
  return useQuery({
    queryKey: ["satisfaction-comparison", currentSeason, comparisonSeason, language],
    queryFn: async (): Promise<SeasonComparisonStats> => {
      const { data: surveys, error } = await supabase
        .from("satisfaction_surveys")
        .select(`
          *,
          inscription:inscriptions(language)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      let typedSurveys = surveys as SatisfactionSurvey[];
      
      // Apply language filter
      if (language !== "all") {
        typedSurveys = typedSurveys.filter((s) => s.inscription?.language === language);
      }
      
      const currentRange = getSeasonDateRange(currentSeason);
      const comparisonRange = getSeasonDateRange(comparisonSeason);
      
      const currentStats = calculatePeriodStats(typedSurveys, currentRange.start, currentRange.end);
      const comparisonStats = calculatePeriodStats(typedSurveys, comparisonRange.start, comparisonRange.end);
      
      return {
        current: {
          label: SEASON_LABELS[currentSeason],
          ...currentStats,
        },
        comparison: {
          label: SEASON_LABELS[comparisonSeason],
          ...comparisonStats,
        },
        deltas: {
          responseRate: currentStats.responseRate - comparisonStats.responseRate,
          averageScore: currentStats.averageScore - comparisonStats.averageScore,
          satisfactionRate: currentStats.satisfactionRate - comparisonStats.satisfactionRate,
          completedSurveys: currentStats.completedSurveys - comparisonStats.completedSurveys,
        },
      };
    },
    enabled: currentSeason !== "all" || comparisonSeason !== "all",
  });
}

export { SEASON_LABELS };

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, ExternalLink, Copy, Check, FileQuestion, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";
import { usePlacementTestStats } from "@/hooks/usePlacementTestStats";
import { Link } from "react-router-dom";

const translations = {
  title: {
    fr: "Tests de niveau",
    "pt-BR": "Testes de nível",
    en: "Placement Tests",
  },
  subtitle: {
    fr: "Test adaptatif par pistes — inscriptions publiques /register",
    "pt-BR": "Teste adaptativo por pistas — inscrições públicas /register",
    en: "Adaptive slope test — public registration at /register",
  },
  viewTest: {
    fr: "Ouvrir l'inscription",
    "pt-BR": "Abrir inscrição",
    en: "Open registration",
  },
  publicLinksTitle: {
    fr: "Liens publics (test adaptatif)",
    "pt-BR": "Links públicos (teste adaptativo)",
    en: "Public links (adaptive test)",
  },
  publicLinksDesc: {
    fr: "Chaque lien pré-sélectionne la langue. Le test commence à la piste verte (5 questions/piste, ≥3 pour continuer).",
    "pt-BR": "Cada link pré-seleciona o idioma. O teste começa na pista verde.",
    en: "Each link pre-selects the language. Test starts on green slope.",
  },
  noTestsTitle: {
    fr: "Aucun test complété via /register",
    "pt-BR": "Nenhum teste via /register",
    en: "No tests via /register yet",
  },
  noTestsDesc: {
    fr: "Les résultats des nouvelles inscriptions avec test adaptatif apparaîtront ici. Les tests importés (Google Form) restent dans les fiches inscription.",
    "pt-BR": "Os resultados das novas inscrições aparecerão aqui.",
    en: "Results from new registrations will appear here.",
  },
  testOf: {
    fr: "Test de",
    "pt-BR": "Teste de",
    en: "Test of",
  },
  questions: {
    fr: "questions",
    "pt-BR": "perguntas",
    en: "questions",
  },
  testsCompleted: {
    fr: "tests complétés",
    "pt-BR": "testes concluídos",
    en: "tests completed",
  },
  averageScore: {
    fr: "Score moyen",
    "pt-BR": "Pontuação média",
    en: "Average Score",
  },
  levelDistribution: {
    fr: "Répartition par niveau",
    "pt-BR": "Distribuição por nível",
    en: "Level Distribution",
  },
};

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-800",
  A2: "bg-orange-100 text-orange-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-emerald-100 text-emerald-800",
  C1: "bg-blue-100 text-blue-800",
  C2: "bg-purple-100 text-purple-800",
};

export default function PlacementTests() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { t } = useLanguage();
  const { data: testStats = [], isLoading } = usePlacementTestStats();

  const copyTestLink = (languageKey: string) => {
    const link = `${window.location.origin}/register?test=${languageKey}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(languageKey);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">{t(translations.subtitle)}</p>
          </div>
          <Button asChild>
            <Link to="/register">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t(translations.viewTest)}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t(translations.publicLinksTitle)}</CardTitle>
            <CardDescription>{t(translations.publicLinksDesc)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {REGISTRATION_LANGUAGES.map((lang) => (
                <div
                  key={lang.value}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{lang.label}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyTestLink(lang.value)}>
                    {copiedLink === lang.value ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : testStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
            <FileQuestion className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.noTestsTitle)}</h3>
            <p className="text-muted-foreground mt-1 max-w-md">{t(translations.noTestsDesc)}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {testStats.map((test) => (
              <Card key={test.languageLabel}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {t(translations.testOf)} {test.languageLabel}
                    </CardTitle>
                    <Badge variant="outline">
                      {test.totalQuestions} {t(translations.questions)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {test.completedTests} {t(translations.testsCompleted)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(translations.averageScore)}</span>
                      <span className="font-medium">{test.averageScore}%</span>
                    </div>
                    <Progress value={test.averageScore} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t(translations.levelDistribution)}</p>
                    <div className="space-y-2">
                      {test.levelDistribution.map((level) => (
                        <div key={level.level} className="flex items-center gap-3">
                          <Badge className={levelColors[level.level] || ""}>{level.level}</Badge>
                          <div className="flex-1">
                            <Progress value={level.percentage} className="h-2" />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {level.count} ({level.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

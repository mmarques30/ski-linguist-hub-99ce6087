import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, ExternalLink, Copy, Check, FileQuestion } from "lucide-react";
import { useState } from "react";
import { useLanguage, Translations } from "@/contexts/LanguageContext";

interface TestStats {
  language: string;
  totalQuestions: number;
  completedTests: number;
  averageScore: number;
  levelDistribution: { level: string; count: number; percentage: number }[];
}

const testStats: TestStats[] = [];

const levelColors: Record<string, string> = {
  A1: "bg-red-100 text-red-800",
  A2: "bg-orange-100 text-orange-800",
  B1: "bg-yellow-100 text-yellow-800",
  B2: "bg-emerald-100 text-emerald-800",
  C1: "bg-blue-100 text-blue-800",
  C2: "bg-purple-100 text-purple-800",
};

const translations = {
  title: {
    fr: "Tests de niveau",
    "pt-BR": "Testes de nível",
    en: "Placement tests",
  } as Translations,
  subtitle: {
    fr: "Gérez les tests de niveau et consultez les résultats",
    "pt-BR": "Gerencie os testes de nível e consulte os resultados",
    en: "Manage placement tests and view results",
  } as Translations,
  viewTest: {
    fr: "Voir le test",
    "pt-BR": "Ver teste",
    en: "View test",
  } as Translations,
  publicLinks: {
    fr: "Liens publics des tests",
    "pt-BR": "Links públicos dos testes",
    en: "Public test links",
  } as Translations,
  publicLinksDescription: {
    fr: "Partagez ces liens avec les stagiaires pour passer les tests de niveau",
    "pt-BR": "Compartilhe esses links com os estagiários para fazer os testes de nível",
    en: "Share these links with students to take placement tests",
  } as Translations,
  english: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  } as Translations,
  portuguese: {
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
  } as Translations,
  russian: {
    fr: "Russe",
    "pt-BR": "Russo",
    en: "Russian",
  } as Translations,
  dutch: {
    fr: "Néerlandais",
    "pt-BR": "Holandês",
    en: "Dutch",
  } as Translations,
  noTestsCompleted: {
    fr: "Aucun test complété",
    "pt-BR": "Nenhum teste concluído",
    en: "No tests completed",
  } as Translations,
  noTestsDescription: {
    fr: "Les statistiques apparaîtront ici lorsque les stagiaires auront complété les tests de niveau.",
    "pt-BR": "As estatísticas aparecerão aqui quando os estagiários concluírem os testes de nível.",
    en: "Statistics will appear here when students complete placement tests.",
  } as Translations,
  testOf: {
    fr: "Test de",
    "pt-BR": "Teste de",
    en: "Test of",
  } as Translations,
  questions: {
    fr: "questions",
    "pt-BR": "questões",
    en: "questions",
  } as Translations,
  testsCompleted: {
    fr: "tests complétés",
    "pt-BR": "testes concluídos",
    en: "tests completed",
  } as Translations,
  averageScore: {
    fr: "Score moyen",
    "pt-BR": "Pontuação média",
    en: "Average score",
  } as Translations,
  levelDistribution: {
    fr: "Répartition par niveau",
    "pt-BR": "Distribuição por nível",
    en: "Level distribution",
  } as Translations,
  viewDetailedResults: {
    fr: "Voir les résultats détaillés",
    "pt-BR": "Ver resultados detalhados",
    en: "View detailed results",
  } as Translations,
};

const availableLanguages = [
  { key: "english", label: translations.english },
  { key: "portuguese", label: translations.portuguese },
  { key: "russian", label: translations.russian },
  { key: "dutch", label: translations.dutch },
];

export default function PlacementTests() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { t } = useLanguage();

  const copyTestLink = (language: string) => {
    const link = `${window.location.origin}/register?test=${language.toLowerCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(language);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
            <p className="text-muted-foreground">
              {t(translations.subtitle)}
            </p>
          </div>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t(translations.viewTest)}
          </Button>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t(translations.publicLinks)}</CardTitle>
            <CardDescription>
              {t(translations.publicLinksDescription)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {availableLanguages.map((language) => (
                <div
                  key={language.key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t(language.label)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTestLink(language.key)}
                  >
                    {copiedLink === language.key ? (
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

        {/* Test Statistics or Empty State */}
        {testStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border bg-card">
            <FileQuestion className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">{t(translations.noTestsCompleted)}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              {t(translations.noTestsDescription)}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {testStats.map((test) => (
              <Card key={test.language}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t(translations.testOf)} {test.language}</CardTitle>
                    <Badge variant="outline">{test.totalQuestions} {t(translations.questions)}</Badge>
                  </div>
                  <CardDescription>
                    {test.completedTests} {t(translations.testsCompleted)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Average Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(translations.averageScore)}</span>
                      <span className="font-medium">{test.averageScore}%</span>
                    </div>
                    <Progress value={test.averageScore} className="h-2" />
                  </div>

                  {/* Level Distribution */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t(translations.levelDistribution)}</p>
                    <div className="space-y-2">
                      {test.levelDistribution.map((level) => (
                        <div
                          key={level.level}
                          className="flex items-center gap-3"
                        >
                          <Badge className={levelColors[level.level]}>
                            {level.level}
                          </Badge>
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

                  <Button variant="outline" className="w-full">
                    {t(translations.viewDetailedResults)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

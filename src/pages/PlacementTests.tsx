import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, ExternalLink, Copy, Check, FileQuestion } from "lucide-react";
import { useState } from "react";

interface TestStats {
  language: string;
  totalQuestions: number;
  completedTests: number;
  averageScore: number;
  levelDistribution: { level: string; count: number; percentage: number }[];
}

const testStats: TestStats[] = [];

const availableLanguages = ["Anglais", "Portugais", "Russe", "Néerlandais"];

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
            <h1 className="text-2xl font-bold">Tests de niveau</h1>
            <p className="text-muted-foreground">
              Gérez les tests de niveau et consultez les résultats
            </p>
          </div>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir le test
          </Button>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Liens publics des tests</CardTitle>
            <CardDescription>
              Partagez ces liens avec les stagiaires pour passer les tests de niveau
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {availableLanguages.map((language) => (
                <div
                  key={language}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{language}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTestLink(language)}
                  >
                    {copiedLink === language ? (
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
            <h3 className="text-lg font-medium">Aucun test complété</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Les statistiques apparaîtront ici lorsque les stagiaires auront complété les tests de niveau.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {testStats.map((test) => (
              <Card key={test.language}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Test de {test.language}</CardTitle>
                    <Badge variant="outline">{test.totalQuestions} questions</Badge>
                  </div>
                  <CardDescription>
                    {test.completedTests} tests complétés
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Average Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score moyen</span>
                      <span className="font-medium">{test.averageScore}%</span>
                    </div>
                    <Progress value={test.averageScore} className="h-2" />
                  </div>

                  {/* Level Distribution */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Répartition par niveau</p>
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
                    Voir les résultats détaillés
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

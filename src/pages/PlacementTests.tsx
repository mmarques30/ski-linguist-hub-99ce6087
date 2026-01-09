import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link2, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

interface TestStats {
  language: string;
  totalQuestions: number;
  completedTests: number;
  averageScore: number;
  levelDistribution: { level: string; count: number; percentage: number }[];
}

const mockTestStats: TestStats[] = [
  {
    language: "English",
    totalQuestions: 17,
    completedTests: 45,
    averageScore: 68,
    levelDistribution: [
      { level: "A1", count: 5, percentage: 11 },
      { level: "A2", count: 12, percentage: 27 },
      { level: "B1", count: 15, percentage: 33 },
      { level: "B2", count: 10, percentage: 22 },
      { level: "C1", count: 3, percentage: 7 },
    ],
  },
  {
    language: "Portuguese",
    totalQuestions: 17,
    completedTests: 28,
    averageScore: 72,
    levelDistribution: [
      { level: "A1", count: 3, percentage: 11 },
      { level: "A2", count: 8, percentage: 29 },
      { level: "B1", count: 10, percentage: 36 },
      { level: "B2", count: 5, percentage: 18 },
      { level: "C1", count: 2, percentage: 7 },
    ],
  },
  {
    language: "Russian",
    totalQuestions: 17,
    completedTests: 15,
    averageScore: 55,
    levelDistribution: [
      { level: "A1", count: 6, percentage: 40 },
      { level: "A2", count: 5, percentage: 33 },
      { level: "B1", count: 3, percentage: 20 },
      { level: "B2", count: 1, percentage: 7 },
      { level: "C1", count: 0, percentage: 0 },
    ],
  },
  {
    language: "Dutch",
    totalQuestions: 17,
    completedTests: 12,
    averageScore: 65,
    levelDistribution: [
      { level: "A1", count: 2, percentage: 17 },
      { level: "A2", count: 4, percentage: 33 },
      { level: "B1", count: 4, percentage: 33 },
      { level: "B2", count: 2, percentage: 17 },
      { level: "C1", count: 0, percentage: 0 },
    ],
  },
];

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
            <h1 className="text-2xl font-bold">Placement Tests</h1>
            <p className="text-muted-foreground">
              Manage language proficiency tests and view results
            </p>
          </div>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview Test
          </Button>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Public Test Links</CardTitle>
            <CardDescription>
              Share these links with students to take placement tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {mockTestStats.map((test) => (
                <div
                  key={test.language}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{test.language}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTestLink(test.language)}
                  >
                    {copiedLink === test.language ? (
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

        {/* Test Statistics */}
        <div className="grid gap-6 md:grid-cols-2">
          {mockTestStats.map((test) => (
            <Card key={test.language}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{test.language} Test</CardTitle>
                  <Badge variant="outline">{test.totalQuestions} questions</Badge>
                </div>
                <CardDescription>
                  {test.completedTests} tests completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Average Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average Score</span>
                    <span className="font-medium">{test.averageScore}%</span>
                  </div>
                  <Progress value={test.averageScore} className="h-2" />
                </div>

                {/* Level Distribution */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Level Distribution</p>
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
                  View Detailed Results
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

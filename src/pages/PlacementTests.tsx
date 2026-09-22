import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, ExternalLink, Copy, Check, FileQuestion, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { REGISTRATION_LANGUAGES } from "@/lib/registration-languages";
import { NIVEAU_NON_RENSEIGNE, usePlacementTestStats } from "@/hooks/usePlacementTestStats";
import { Link } from "react-router-dom";
import {
  CardGrid,
  MeterRow,
  PageHeader,
  PageShell,
  RankedBarList,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  seriesColor,
} from "@/components/ui-kit";
import type { PillTone } from "@/components/ui-kit";

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
  copyLink: {
    fr: "Copier le lien",
    "pt-BR": "Copiar o link",
    en: "Copy link",
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
  testTitle: {
    fr: "Test —",
    "pt-BR": "Teste —",
    en: "Test —",
  },
  questions: {
    fr: "questions",
    "pt-BR": "perguntas",
    en: "questions",
  },
  testCompleted: {
    fr: "test complété",
    "pt-BR": "teste concluído",
    en: "test completed",
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
    fr: "Répartition par piste",
    "pt-BR": "Distribuição por pista",
    en: "Distribution by slope",
  },
};

/**
 * Pistes dans un ordre figé : la teinte suit la piste (l'entité), jamais son
 * rang dans la liste d'une langue donnée. Cinq pistes au plus — on ne replie
 * donc jamais sur « Autre » ici.
 */
const PISTE_SERIES_ORDER = [
  "Piste verte",
  "Piste bleue",
  "Piste rouge",
  "Piste noire",
  NIVEAU_NON_RENSEIGNE,
];

const levelTones: Record<string, PillTone> = {
  "Piste verte": "success",
  "Piste bleue": "info",
  "Piste rouge": "danger",
  "Piste noire": "neutral",
  [NIVEAU_NON_RENSEIGNE]: "neutral",
};

/** Couleur de série attachée à la piste, pas à sa position. */
function pisteColor(level: string): string {
  const index = PISTE_SERIES_ORDER.indexOf(level);
  return seriesColor(index === -1 ? PISTE_SERIES_ORDER.length - 1 : index);
}

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
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={GraduationCap}
          tone="blue"
          actions={
            <Button asChild>
              <Link to="/register">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t(translations.viewTest)}
              </Link>
            </Button>
          }
        />

        <SurfaceCard
          title={t(translations.publicLinksTitle)}
          description={t(translations.publicLinksDesc)}
          icon={Link2}
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {REGISTRATION_LANGUAGES.map((lang) => (
              <div
                key={lang.value}
                className="flex items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{lang.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyTestLink(lang.value)}
                  aria-label={`${t(translations.copyLink)} — ${lang.label}`}
                >
                  {copiedLink === lang.value ? (
                    <Check className="h-4 w-4 text-[hsl(var(--status-good))]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {isLoading ? (
          <CardGrid cols={2}>
            {[0, 1].map((index) => (
              <SurfaceCard key={index}>
                <div className="space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-2/3" />
                </div>
              </SurfaceCard>
            ))}
          </CardGrid>
        ) : testStats.length === 0 ? (
          <SurfaceCard flush>
            <TableEmpty
              icon={FileQuestion}
              title={t(translations.noTestsTitle)}
              description={t(translations.noTestsDesc)}
            />
          </SurfaceCard>
        ) : (
          <CardGrid cols={2}>
            {testStats.map((test) => (
              <SurfaceCard
                key={test.languageLabel}
                title={`${t(translations.testTitle)} ${test.languageLabel}`}
                description={`${test.completedTests} ${
                  test.completedTests === 1
                    ? t(translations.testCompleted)
                    : t(translations.testsCompleted)
                }`}
                actions={
                  <StatusPill tone="neutral">
                    {test.totalQuestions} {t(translations.questions)}
                  </StatusPill>
                }
              >
                <div className="space-y-6">
                  <MeterRow
                    label={t(translations.averageScore)}
                    value={test.averageScore}
                    max={100}
                    display={`${test.averageScore}%`}
                  />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t(translations.levelDistribution)}</p>
                    <RankedBarList
                      max={test.completedTests}
                      items={test.levelDistribution.map((level) => ({
                        key: level.level,
                        label: (
                          <StatusPill tone={levelTones[level.level] ?? "neutral"} size="sm">
                            {level.level}
                          </StatusPill>
                        ),
                        value: level.count,
                        display: `${level.count} (${level.percentage}%)`,
                        color: pisteColor(level.level),
                      }))}
                    />
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </CardGrid>
        )}
      </PageShell>
    </MainLayout>
  );
}

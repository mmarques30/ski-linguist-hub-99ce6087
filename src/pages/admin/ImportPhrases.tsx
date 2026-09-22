import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CardGrid,
  PageHeader,
  PageShell,
  StatusPill,
  SurfaceCard,
} from "@/components/ui-kit";
import { useToast } from "@/hooks/use-toast";
import { useBulkImportPhrases, useTestPhrases } from "@/hooks/useTestPhrases";
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  FILE_LANGUAGE_FLAGS,
  fileCategoryLabel,
  fileLanguageLabel,
  phraseBankCounts,
  type PhraseBankItem,
} from "@/lib/test-phrases-bank";
import testPhrasesData from "@/data/test_phrases_complete.json";

interface FilePhrase {
  code: string;
  language: string;
  category: string;
  text_fr: string;
  context?: string;
  error_type?: string;
  is_correction: boolean;
}

/** Les étiquettes langue et catégorie du fichier partent en base telles quelles. */
function toInsertRow(phrase: FilePhrase, index: number) {
  return {
    language: phrase.language,
    category: phrase.category,
    profession: null,
    level_min: null,
    level_max: null,
    code: phrase.code,
    text_fr: phrase.text_fr,
    context: phrase.context ?? null,
    error_type: phrase.error_type ?? null,
    is_correction: phrase.is_correction,
    is_positive: !phrase.is_correction,
    order_index: index + 1,
    active: true,
  };
}

export default function ImportPhrasesPage() {
  const { toast } = useToast();
  const bulkImport = useBulkImportPhrases();
  const { data: existingPhrases } = useTestPhrases({ active: null });

  const phrases = testPhrasesData.phrases as FilePhrase[];
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null);

  const existingCodes = useMemo(
    () => new Set(existingPhrases?.map((p) => p.code) || []),
    [existingPhrases],
  );
  const newPhrases = phrases.filter((p) => !existingCodes.has(p.code));
  const duplicatePhrases = phrases.filter((p) => existingCodes.has(p.code));

  const counts = useMemo(() => phraseBankCounts(phrases as unknown as PhraseBankItem[]), [phrases]);
  const corrections = phrases.filter((p) => p.is_correction).length;
  const announced = testPhrasesData.metadata.total_phrases;

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      const phrasesToImport = replaceExisting ? phrases : newPhrases;

      if (phrasesToImport.length === 0) {
        toast({
          title: "Rien à importer",
          description: "Toutes les phrases existent déjà dans la base de données.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      await bulkImport.mutateAsync(
        phrasesToImport.map((phrase) => toInsertRow(phrase, phrases.indexOf(phrase))),
      );

      setImportResult({
        success: phrasesToImport.length,
        skipped: replaceExisting ? 0 : duplicatePhrases.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title="Import des Phrases"
          icon={FileJson}
          tone="purple"
          description="Importer les phrases pré-rédigées pour les évaluations"
          meta={
            <>
              <StatusPill tone="info">{counts.total} phrases dans le fichier</StatusPill>
              <StatusPill tone={newPhrases.length > 0 ? "success" : "neutral"}>
                {newPhrases.length} nouvelle{newPhrases.length > 1 ? "s" : ""}
              </StatusPill>
            </>
          }
        />

        {announced !== phrases.length && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Écart avec la métadonnée du fichier</AlertTitle>
            <AlertDescription>
              Le fichier annonce {announced} phrases et en contient {phrases.length}. Seules
              les {phrases.length} phrases présentes sont importées, sans dédoublonnage ni
              renommage.
            </AlertDescription>
          </Alert>
        )}

        <CardGrid cols={2}>
          <SurfaceCard
            title="Fichier à importer"
            icon={FileJson}
            description={testPhrasesData.metadata.description}
          >
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Version : {testPhrasesData.metadata.version} · Créé :{" "}
                {testPhrasesData.metadata.created_date}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">Par catégorie</h4>
                  <div className="space-y-1">
                    {Object.entries(counts.byCategory).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">{fileCategoryLabel(cat)}</span>
                        <StatusPill tone="neutral" size="sm">{count}</StatusPill>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Par langue</h4>
                  <div className="space-y-1">
                    {Object.entries(counts.byLanguage).map(([lang, count]) => (
                      <div key={lang} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate">
                          {FILE_LANGUAGE_FLAGS[lang] || ""} {fileLanguageLabel(lang)}
                        </span>
                        <StatusPill tone="neutral" size="sm">{count}</StatusPill>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-lg font-semibold tabular">
                  Total : {counts.total} phrases
                </div>
                <p className="text-sm text-muted-foreground">
                  {corrections} corrections · {counts.total - corrections} explications
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Options d'import" icon={Upload}>
            <div className="space-y-4">
              <div className="space-y-2 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span>Phrases déjà existantes:</span>
                  <StatusPill tone={duplicatePhrases.length > 0 ? "warning" : "neutral"} size="sm">
                    {duplicatePhrases.length}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Nouvelles phrases:</span>
                  <StatusPill tone="success" size="sm">
                    {newPhrases.length}
                  </StatusPill>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="replace"
                  checked={replaceExisting}
                  onCheckedChange={(checked) => setReplaceExisting(checked === true)}
                />
                <label htmlFor="replace" className="text-sm">
                  Réimporter les phrases existantes (écrase les modifications)
                </label>
              </div>

              {importResult && (
                <div className="rounded-[var(--radius)] border border-[hsl(var(--tint-teal-ring))] bg-[hsl(var(--tint-teal-bg))] p-4">
                  <div className="flex items-center gap-2 text-[hsl(var(--tint-teal-fg))]">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Import réussi!</span>
                  </div>
                  <div className="mt-2 text-sm text-[hsl(var(--tint-teal-fg))]">
                    {importResult.success} phrases importées
                    {importResult.skipped > 0 && `, ${importResult.skipped} ignorées (déjà existantes)`}
                  </div>
                </div>
              )}

              {duplicatePhrases.length > 0 && !replaceExisting && (
                <div className="rounded-[var(--radius)] border border-[hsl(var(--tint-gold-ring))] bg-[hsl(var(--tint-gold-bg))] p-4">
                  <div className="flex items-center gap-2 text-[hsl(var(--tint-gold-fg))]">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Attention</span>
                  </div>
                  <div className="mt-2 text-sm text-[hsl(var(--tint-gold-fg))]">
                    {duplicatePhrases.length} phrases existent déjà et seront ignorées.
                    Cochez l'option ci-dessus pour les réimporter.
                  </div>
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={importing || (newPhrases.length === 0 && !replaceExisting)}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer {replaceExisting ? phrases.length : newPhrases.length} phrases
                  </>
                )}
              </Button>
            </div>
          </SurfaceCard>
        </CardGrid>
      </PageShell>
    </MainLayout>
  );
}

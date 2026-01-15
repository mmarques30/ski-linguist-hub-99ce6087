import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useBulkImportPhrases, useTestPhrases } from "@/hooks/useTestPhrases";
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { LANGUAGE_FLAGS, CATEGORY_LABELS } from "@/lib/evaluation-utils";
import testPhrasesData from "@/data/test_phrases_import.json";

interface PhraseToImport {
  language: string;
  category: string;
  profession: string | null;
  level_min: string | null;
  level_max: string | null;
  code: string;
  text_fr: string;
  is_positive: boolean;
  order_index: number;
}

export default function ImportPhrasesPage() {
  const { toast } = useToast();
  const bulkImport = useBulkImportPhrases();
  const { data: existingPhrases } = useTestPhrases({ active: null });
  
  const [phrases] = useState<PhraseToImport[]>(testPhrasesData.phrases);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null);

  const existingCodes = new Set(existingPhrases?.map(p => p.code) || []);
  const newPhrases = phrases.filter(p => !existingCodes.has(p.code));
  const duplicatePhrases = phrases.filter(p => existingCodes.has(p.code));

  const categoryStats = phrases.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageStats = phrases.reduce((acc, p) => {
    acc[p.language] = (acc[p.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      const phrasesToImport = replaceExisting ? phrases : newPhrases;
      
      if (phrasesToImport.length === 0) {
        toast({
          title: "Rien à importer",
          description: "Toutes les phrases existent déjà dans la base de données.",
          variant: "destructive"
        });
        setImporting(false);
        return;
      }

      // Transform to match expected format
      const formattedPhrases = phrasesToImport.map(p => ({
        language: p.language,
        category: p.category,
        profession: p.profession,
        level_min: p.level_min,
        level_max: p.level_max,
        code: p.code,
        text_fr: p.text_fr,
        is_positive: p.is_positive,
        order_index: p.order_index,
        active: true
      }));

      await bulkImport.mutateAsync(formattedPhrases);
      
      setImportResult({
        success: phrasesToImport.length,
        skipped: replaceExisting ? 0 : duplicatePhrases.length
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Import des Phrases</h1>
          <p className="text-muted-foreground">
            Importer les phrases pré-rédigées pour les évaluations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* File Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Fichier à importer
              </CardTitle>
              <CardDescription>
                {testPhrasesData.metadata.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Version: {testPhrasesData.metadata.version} | 
                Créé: {testPhrasesData.metadata.created}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Par catégorie</h4>
                  <div className="space-y-1">
                    {Object.entries(categoryStats).map(([cat, count]) => (
                      <div key={cat} className="flex justify-between text-sm">
                        <span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Par langue</h4>
                  <div className="space-y-1">
                    {Object.entries(languageStats).map(([lang, count]) => (
                      <div key={lang} className="flex justify-between text-sm">
                        <span>
                          {LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS] || ""} {lang}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  Total: {phrases.length} phrases
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Options d'import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span>Phrases déjà existantes:</span>
                  <Badge variant={duplicatePhrases.length > 0 ? "secondary" : "outline"}>
                    {duplicatePhrases.length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Nouvelles phrases:</span>
                  <Badge variant="default" className="bg-green-600">
                    {newPhrases.length}
                  </Badge>
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
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Import réussi!</span>
                  </div>
                  <div className="mt-2 text-sm text-green-600 dark:text-green-500">
                    {importResult.success} phrases importées
                    {importResult.skipped > 0 && `, ${importResult.skipped} ignorées (déjà existantes)`}
                  </div>
                </div>
              )}

              {duplicatePhrases.length > 0 && !replaceExisting && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Attention</span>
                  </div>
                  <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-500">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

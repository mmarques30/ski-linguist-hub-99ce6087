import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { parseFliFormResponsesCsv, FliFormResponsesImportPreview } from "@/lib/fli-form-responses-csv-import";
import { useFliFormResponsesImport } from "@/hooks/useFliFormResponsesImport";
import { toast } from "sonner";

export function FliFormResponsesImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FliFormResponsesImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const importData = useFliFormResponsesImport();

  const handleFile = async (file: File) => {
    const text = await file.text();
    setPreview(parseFliFormResponsesCsv(text));
    setFileName(file.name);
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      const result = await importData.mutateAsync(preview.rows);
      toast.success(
        `Import terminé: ${result.placementTestsCreated} tests, ${result.inscriptionsEnriched} inscriptions enrichies`
      );
      if (result.studentsUnmatched > 0) {
        toast.warning(`${result.studentsUnmatched} réponses sans stagiaire correspondant`);
      }
      if (result.skippedExistingTests > 0) {
        toast.info(`${result.skippedExistingTests} tests déjà importés ignorés`);
      }
      if (result.errors.length > 0) {
        console.warn("Import errors:", result.errors.slice(0, 20));
      }
      setPreview(null);
      setFileName("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaire FLI — Réponses + test d'entrée (ancien)</CardTitle>
        <CardDescription>
          Export Google Forms (séparateur <code>,</code>). Déduplique les soumissions répétées,
          croise avec les stagiaires/inscriptions existants et importe les <code>placement_tests</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cliquez pour sélectionner le CSV du formulaire</p>
            </div>
          )}
        </div>

        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{preview.totalRows}</p>
                <p className="text-xs text-muted-foreground">Lignes CSV</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-primary">{preview.deduplicatedRows}</p>
                <p className="text-xs text-muted-foreground">Après déduplication</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{preview.withTestAnswers}</p>
                <p className="text-xs text-muted-foreground">Avec réponses test</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{preview.withEmail}</p>
                <p className="text-xs text-muted-foreground">Avec email</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(preview.byLanguage).map(([lang, count]) => (
                <Badge key={lang} variant="secondary">
                  {lang}: {count}
                </Badge>
              ))}
              {preview.skippedDuplicates > 0 && (
                <Badge variant="outline">{preview.skippedDuplicates} doublons ignorés</Badge>
              )}
            </div>

            <Button onClick={handleImport} disabled={importData.isPending} className="w-full">
              {importData.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Importer {preview.deduplicatedRows} réponses (test + croisement)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

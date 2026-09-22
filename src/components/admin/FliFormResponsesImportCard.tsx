import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, ClipboardList } from "lucide-react";
import { StatTile, StatTileGrid, StatusPill, SurfaceCard } from "@/components/ui-kit";
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
    <SurfaceCard
      title="Formulaire FLI — Réponses + test d'entrée (ancien)"
      icon={ClipboardList}
      description={
        <>
          Export Google Forms (séparateur <code>,</code>). Déduplique les soumissions répétées,
          croise avec les stagiaires/inscriptions existants et importe les <code>placement_tests</code>.
        </>
      }
      actions={fileName ? <StatusPill tone="info">{fileName}</StatusPill> : undefined}
    >
      <div className="space-y-4">
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
        <button
          type="button"
          className="w-full cursor-pointer rounded-[var(--radius)] border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-[hsl(var(--surface-sunken))]"
          onClick={() => fileRef.current?.click()}
        >
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
        </button>

        {preview && (
          <div className="space-y-4">
            <StatTileGrid cols={4}>
              <StatTile label="Lignes CSV" value={preview.totalRows} tone="neutral" />
              <StatTile label="Après déduplication" value={preview.deduplicatedRows} tone="gold" />
              <StatTile label="Avec réponses test" value={preview.withTestAnswers} tone="blue" />
              <StatTile label="Avec email" value={preview.withEmail} tone="teal" />
            </StatTileGrid>

            <div className="flex flex-wrap gap-2">
              {Object.entries(preview.byLanguage).map(([lang, count]) => (
                <StatusPill key={lang} tone="neutral" size="sm">
                  {lang}: {count}
                </StatusPill>
              ))}
              {preview.skippedDuplicates > 0 && (
                <StatusPill tone="warning" size="sm">
                  {preview.skippedDuplicates} doublons ignorés
                </StatusPill>
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
      </div>
    </SurfaceCard>
  );
}

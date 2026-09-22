import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { StatusPill, SurfaceCard } from "@/components/ui-kit";
import { parseFliInscriptionsCsv, FliInscriptionsImportPreview } from "@/lib/fli-inscriptions-csv-import";
import { useFliInscriptionsImport } from "@/hooks/useFliInscriptionsImport";
import { toast } from "sonner";

export function FliInscriptionsImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<FliInscriptionsImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [importInscriptions, setImportInscriptions] = useState(true);
  const [enrichMonitors, setEnrichMonitors] = useState(true);
  const importData = useFliInscriptionsImport();

  const handleFile = async (file: File) => {
    const text = await file.text();
    setPreview(parseFliInscriptionsCsv(text));
    setFileName(file.name);
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      const result = await importData.mutateAsync({
        rows: preview.rows,
        monitorContacts: preview.monitorContacts,
        options: { importInscriptions, enrichMonitors },
      });

      const parts = [];
      if (importInscriptions) {
        parts.push(`${result.inscriptionsImported} inscriptions`);
        parts.push(`${result.studentsUpserted} stagiaires créés`);
      }
      if (enrichMonitors) parts.push(`${result.monitorsEnriched} moniteurs enrichis`);

      toast.success(`Import terminé: ${parts.join(", ")}`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erreur(s) — voir console`);
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
      title="Tableur FLI — Inscriptions historiques"
      icon={FileSpreadsheet}
      description={
        <>
          Export tableur (séparateur <code>;</code>) : inscriptions, stagiaires, écoles de ski.
          Complète aussi la base moniteurs avec les contacts trouvés.
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
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cliquez pour sélectionner un fichier CSV
              </p>
            </>
          )}
        </button>

        {preview && (
          <div className="space-y-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-4">
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="min-w-0">
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Lignes lues</dt>
                <dd className="font-semibold tabular">{preview.totalRows}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Inscriptions importables</dt>
                <dd className="font-semibold tabular">{preview.importableInscriptions}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Stagiaires uniques</dt>
                <dd className="font-semibold tabular">{preview.uniqueStudents}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-2xs uppercase tracking-wide text-muted-foreground">Contacts moniteurs</dt>
                <dd className="font-semibold tabular">{preview.uniqueMonitorContacts}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              {Object.entries(preview.byStatus).map(([status, count]) => (
                <StatusPill key={status} tone="neutral" size="sm">{status}: {count}</StatusPill>
              ))}
              <StatusPill tone="info" size="sm">{preview.withSkiSchool} avec école de ski</StatusPill>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="import-inscriptions"
                  checked={importInscriptions}
                  onCheckedChange={(v) => setImportInscriptions(!!v)}
                />
                <Label htmlFor="import-inscriptions">
                  Importer les inscriptions ({preview.importableInscriptions})
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enrich-monitors"
                  checked={enrichMonitors}
                  onCheckedChange={(v) => setEnrichMonitors(!!v)}
                />
                <Label htmlFor="enrich-monitors">
                  Enrichir la base moniteurs ({preview.uniqueMonitorContacts} emails)
                </Label>
              </div>
            </div>

            {importData.isPending && <Progress value={55} className="h-2" />}
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!preview || importData.isPending || (!importInscriptions && !enrichMonitors)}
        >
          {importData.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Lancer l&apos;import
        </Button>
      </div>
    </SurfaceCard>
  );
}

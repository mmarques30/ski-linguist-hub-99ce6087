import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
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
    <Card>
      <CardHeader>
        <CardTitle>Planilha FLI — Inscrições históricas</CardTitle>
        <CardDescription>
          Formato Excel exportado (séparateur <code>;</code>) : inscriptions, stagiaires, écoles de ski.
          Complète aussi la base moniteurs avec les contacts trouvés.
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
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cliquez pour sélectionner incriptions_29072026.csv
              </p>
            </>
          )}
        </div>

        {preview && (
          <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Lignes lues : <strong>{preview.totalRows}</strong></div>
              <div>Inscriptions importables : <strong>{preview.importableInscriptions}</strong></div>
              <div>Stagiaires uniques : <strong>{preview.uniqueStudents}</strong></div>
              <div>Contacts moniteurs : <strong>{preview.uniqueMonitorContacts}</strong></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(preview.byStatus).map(([status, count]) => (
                <Badge key={status} variant="outline">{status}: {count}</Badge>
              ))}
              <Badge variant="secondary">{preview.withSkiSchool} avec école de ski</Badge>
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
      </CardContent>
    </Card>
  );
}

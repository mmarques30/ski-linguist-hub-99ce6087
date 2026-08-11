import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { parseSkiMonitorCsv, SkiMonitorImportPreview } from "@/lib/ski-monitor-csv-import";
import { useImportSkiMonitors } from "@/hooks/useSkiMonitors";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkiMonitorImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<SkiMonitorImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const importMonitors = useImportSkiMonitors();

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseSkiMonitorCsv(text);
    setPreview(parsed);
    setFileName(file.name);
  };

  const handleImport = async () => {
    if (!preview?.rows.length) return;
    try {
      const result = await importMonitors.mutateAsync(
        preview.rows.map((r) => ({
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          phone: r.phone,
          home_station: r.home_station,
          status: r.status,
          notes: r.source_liste ? `Liste: ${r.source_liste}${r.notes ? ` | ${r.notes}` : ""}` : r.notes,
        }))
      );
      toast.success(`${result.imported} moniteur(s) importé(s)`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} lot(s) en erreur partielle`);
      }
      setPreview(null);
      setFileName("");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  const reset = () => {
    setPreview(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer la base moniteurs</DialogTitle>
          <DialogDescription>
            Fichier CSV FLI (séparateur ;). Colonnes : Name, Email Address, Status, ESF, station.
            Les doublons d&apos;email sont fusionnés (priorité : Active &gt; désinscrit).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
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
                  Cliquez ou déposez FLI_Listing_Complet_Contacts.csv
                </p>
              </>
            )}
          </div>

          {preview && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Lignes lues : <strong>{preview.totalRows}</strong></div>
                <div>Emails uniques : <strong>{preview.uniqueEmails}</strong></div>
                <div>Doublons ignorés : <strong>{preview.duplicatesSkipped}</strong></div>
                <div>Emails invalides : <strong>{preview.invalidEmails}</strong></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-600">{preview.active} actifs</Badge>
                <Badge variant="secondary">{preview.unsubscribed} désinscrits</Badge>
                <Badge variant="outline">{preview.withStation} avec station</Badge>
              </div>
              {importMonitors.isPending && (
                <div className="space-y-1">
                  <Progress value={66} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">Import en cours…</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!preview?.rows.length || importMonitors.isPending}
            >
              {importMonitors.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Importer {preview ? preview.uniqueEmails : 0} contact(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

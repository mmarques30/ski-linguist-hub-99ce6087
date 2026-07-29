import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { parseEsfDirectorsCsv, EsfDirectorsImportPreview } from "@/lib/esf-directors-csv-import";
import { useEsfDirectorsImport } from "@/hooks/useEsfDirectorsImport";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EsfDirectorsImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<EsfDirectorsImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const importDirectors = useEsfDirectorsImport();

  const handleFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("windows-1252");
    const text = decoder.decode(buffer);
    const parsed = parseEsfDirectorsCsv(text);
    setPreview(parsed);
    setFileName(file.name);
  };

  const handleImport = async () => {
    if (!preview?.rows.length) return;
    try {
      const result = await importDirectors.mutateAsync(preview.rows);
      toast.success(
        `BD ESF importée: ${result.created} créés, ${result.updated} mis à jour, ${result.contactsUpserted} directeurs`
      );
      if (result.skiSchoolsUpdated > 0) {
        toast.info(`${result.skiSchoolsUpdated} école(s) ski_schools enrichie(s)`);
      }
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} ligne(s) en erreur`);
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
          <DialogTitle>Importer la BD ESF (directeurs)</DialogTitle>
          <DialogDescription>
            Fichier CSV séparateur point-virgule (encodage Windows). Colonnes : ESF, Ecole, Nom, Prénom,
            Courriel Dir., Portable directeur, etc. Les partenaires existants sont mis à jour par code ou nom.
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
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {preview ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-primary" />
                <p className="font-medium">{fileName}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary">{preview.validRows} ESF</Badge>
                  <Badge variant="outline">{preview.withDirectorEmail} emails dir.</Badge>
                  <Badge variant="outline">{preview.withDirectorPhone} tél. dir.</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto" />
                <p>Cliquez ou déposez BD ESF.csv</p>
              </div>
            )}
          </div>

          {preview && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Changer de fichier</Button>
              <Button onClick={handleImport} disabled={importDirectors.isPending}>
                {importDirectors.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Import...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" /> Importer {preview.validRows} ESF</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

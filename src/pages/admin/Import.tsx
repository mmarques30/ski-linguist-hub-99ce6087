import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FliInscriptionsImportCard } from "@/components/admin/FliInscriptionsImportCard";

type TableType = "instructors" | "ski_schools" | "students" | "inscriptions" | "invoices";

interface CSVRow {
  [key: string]: string;
}

interface ImportStats {
  totalRows: number;
  imported: number;
  errors: string[];
}

// Column mappings for each table type
const COLUMN_MAPPINGS: Record<TableType, Record<string, string>> = {
  instructors: {
    id: "id",
    full_name: "full_name",
    email: "email",
    phone: "phone",
    languages: "languages",
    hourly_rate: "hourly_rate",
    status: "status",
  },
  ski_schools: {
    id: "id",
    name: "name",
    director_name: "director_name",
    director_phone: "director_phone",
    address: "address",
    email: "email",
    contact_notes: "contact_notes",
  },
  students: {
    id: "id",
    email: "email",
    first_name: "first_name",
    last_name: "last_name",
    full_name: "full_name",
    gender: "gender",
    phone: "phone",
    address: "address",
    postal_code: "postal_code",
    city: "city",
    company: "company",
  },
  inscriptions: {
    id: "id",
    code: "code",
    student_id: "student_id",
    instructor_id: "instructor_id",
    ski_school_id: "ski_school_id",
    modality: "modality",
    type: "type",
    language: "language",
    location: "location",
    start_date: "start_date",
    end_date: "end_date",
    duration_hours: "duration_hours",
    price_ht: "price_ht",
    deposit: "deposit",
    deposit_date: "deposit_date",
    payment_mode: "payment_mode",
    level_entry: "level_entry",
    level_exit_general: "level_exit_general",
    level_exit_specific: "level_exit_specific",
    certification: "certification",
    certification_date: "certification_date",
    certification_result: "certification_result",
    status: "status",
    status_original: "status_original",
    observations: "observations",
  },
  invoices: {
    invoice_number: "invoice_number",
    invoice_date: "invoice_date",
    due_date: "due_date",
    invoice_type: "invoice_type",
    payment_type: "payment_type",
    amount_ht: "amount_ht",
    tva_rate: "tva_rate",
    amount_ttc: "amount_ttc",
    status: "status",
    payment_date: "payment_date",
    payment_method: "payment_method",
    notes: "notes",
    inscription_id: "inscription_id",
    related_invoice_id: "related_invoice_id",
  },
};

// Parse CSV with comma separator
function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }
  
  const headers = headerLine.split(',').map(h => h.trim());
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 2) continue;
    
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

function isEmpty(value: string): boolean {
  return !value || value === '-' || value === 'N/A' || value.trim() === '';
}

// Validate UUID format (8-4-4-4-12 hex characters)
function isValidUUID(id: string): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Convert invalid UUIDs to valid ones by replacing non-hex first character
function sanitizeUUID(id: string): string | null {
  if (!id || isEmpty(id)) return null;
  
  // If already valid, return as-is
  if (isValidUUID(id)) return id;
  
  // Try to fix common issues: replace non-hex first character with 'a'
  let sanitized = id;
  if (!/^[0-9a-f]/i.test(id[0])) {
    sanitized = 'a' + id.slice(1);
  }
  
  // If still not valid, return null (let DB generate)
  return isValidUUID(sanitized) ? sanitized : null;
}

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [allRows, setAllRows] = useState<CSVRow[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableType>("instructors");
  const [isImporting, setIsImporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStats(null);
    setProgress(0);

    const text = await selectedFile.text();
    const rows = parseCSV(text);
    setAllRows(rows);
    setPreview(rows.slice(0, 10));
  };

  const handlePurgeData = async () => {
    setIsPurging(true);
    try {
      // Delete in reverse order to respect foreign keys
      const { error: inscError } = await supabase.from('inscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (inscError) throw new Error(`Inscriptions: ${inscError.message}`);

      const { error: studError } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (studError) throw new Error(`Students: ${studError.message}`);

      const { error: schoolError } = await supabase.from('ski_schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (schoolError) throw new Error(`Ski Schools: ${schoolError.message}`);

      const { error: instrError } = await supabase.from('instructors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (instrError) throw new Error(`Instructors: ${instrError.message}`);

      toast({
        title: "Données purgées",
        description: "Toutes les données ont été supprimées avec succès.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de purge",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsPurging(false);
    }
  };

  const handleImport = async () => {
    if (allRows.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    const importStats: ImportStats = {
      totalRows: allRows.length,
      imported: 0,
      errors: [],
    };

    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < allRows.length; i += batchSize) {
      batches.push(allRows.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const records = batch.map((row, rowIndex) => {
        const globalIndex = batchIndex * batchSize + rowIndex;
        try {
          return mapRowToRecord(row, selectedTable);
        } catch (error) {
          importStats.errors.push(`Ligne ${globalIndex + 2}: ${error}`);
          return null;
        }
      }).filter(Boolean);

      if (records.length > 0) {
        const { error } = await supabase.from(selectedTable).insert(records as any[]);
        
        if (error) {
          importStats.errors.push(`Batch ${batchIndex + 1}: ${error.message}`);
        } else {
          importStats.imported += records.length;
        }
      }

      setProgress(Math.round(((batchIndex + 1) / batches.length) * 100));
    }

    setStats(importStats);
    setIsImporting(false);
    
    toast({
      title: "Import terminé",
      description: `${importStats.imported} enregistrements importés dans ${selectedTable}.`,
    });
  };

  const mapRowToRecord = (row: CSVRow, table: TableType) => {
    switch (table) {
      case "instructors": {
        const nameParts = (row.full_name || '').split(' ');
        const firstName = nameParts.slice(0, -1).join(' ') || '';
        const lastName = nameParts[nameParts.length - 1] || row.full_name || 'Inconnu';
        
        const sanitizedId = sanitizeUUID(row.id);
        return {
          ...(sanitizedId && { id: sanitizedId }),
          first_name: firstName || null,
          last_name: lastName,
          email: isEmpty(row.email) ? null : row.email,
          phone: isEmpty(row.phone) ? null : row.phone,
          languages: isEmpty(row.languages) ? null : row.languages.split(',').map(l => l.trim()),
          is_active: row.status === 'active',
        };
      }
      
      case "ski_schools": {
        const sanitizedId = sanitizeUUID(row.id);
        return {
          ...(sanitizedId && { id: sanitizedId }),
          name: row.name || 'Inconnu',
          director_name: isEmpty(row.director_name) ? null : row.director_name,
          director_phone: isEmpty(row.director_phone) ? null : row.director_phone,
          observations: isEmpty(row.contact_notes) ? null : row.contact_notes,
        };
      }
      
      case "students": {
        const sanitizedId = sanitizeUUID(row.id);
        return {
          ...(sanitizedId && { id: sanitizedId }),
          email: row.email || `unknown-${Date.now()}@placeholder.com`,
          first_name: row.first_name || 'Inconnu',
          last_name: row.last_name || 'Inconnu',
          civility: isEmpty(row.gender) ? null : row.gender,
          phone: isEmpty(row.phone) ? null : row.phone,
          street_address: isEmpty(row.address) ? null : row.address,
          postal_code: isEmpty(row.postal_code) ? null : row.postal_code,
          city: isEmpty(row.city) ? null : row.city,
          company: isEmpty(row.company) ? null : row.company,
        };
      }
      
      case "inscriptions": {
        const sanitizedId = sanitizeUUID(row.id);
        const sanitizedStudentId = sanitizeUUID(row.student_id);
        const sanitizedInstructorId = sanitizeUUID(row.instructor_id);
        const sanitizedSkiSchoolId = sanitizeUUID(row.ski_school_id);
        
        return {
          ...(sanitizedId && { id: sanitizedId }),
          code: isEmpty(row.code) ? null : row.code,
          student_id: sanitizedStudentId || row.student_id, // Required field
          instructor_id: sanitizedInstructorId,
          ski_school_id: sanitizedSkiSchoolId,
          modality: isEmpty(row.modality) ? null : row.modality,
          course_type: isEmpty(row.type) ? null : row.type,
          language: row.language || 'Non spécifié',
          course_location: isEmpty(row.location) ? null : row.location,
          start_date: row.start_date,
          end_date: row.end_date,
          duration_hours: isEmpty(row.duration_hours) ? null : parseFloat(row.duration_hours),
          price: isEmpty(row.price_ht) ? null : parseFloat(row.price_ht),
          deposit_amount: isEmpty(row.deposit) ? null : parseFloat(row.deposit),
          deposit_date: isEmpty(row.deposit_date) ? null : row.deposit_date,
          payment_method: isEmpty(row.payment_mode) ? null : row.payment_mode,
          entry_level: isEmpty(row.level_entry) ? null : row.level_entry,
          final_general_level: isEmpty(row.level_exit_general) ? null : row.level_exit_general,
          final_specific_level: isEmpty(row.level_exit_specific) ? null : row.level_exit_specific,
          certification_type: isEmpty(row.certification) ? null : row.certification,
          certification_date: isEmpty(row.certification_date) ? null : row.certification_date,
          certification_result: isEmpty(row.certification_result) ? null : row.certification_result,
          status: mapStatus(row.status),
          observations: isEmpty(row.observations) ? null : row.observations,
        };
      }
      
      case "invoices": {
        const invoiceType = (row.invoice_type || 'formation').toLowerCase();
        const validTypes = ['formation', 'test', 'soustraitance'];
        const type = validTypes.includes(invoiceType) ? invoiceType : 'formation';
        
        const statusVal = (row.status || 'draft').toLowerCase();
        const validStatuses = ['draft', 'sent', 'paid', 'cancelled'];
        const status = validStatuses.includes(statusVal) ? statusVal : 'draft';
        
        const paymentTypeVal = (row.payment_type || 'integral').toLowerCase();
        const validPaymentTypes = ['adiantamento', 'saldo', 'integral'];
        const paymentType = validPaymentTypes.includes(paymentTypeVal) ? paymentTypeVal : 'integral';
        
        const sanitizedInscriptionId = sanitizeUUID(row.inscription_id);
        const sanitizedRelatedInvoiceId = sanitizeUUID(row.related_invoice_id);
        
        return {
          invoice_number: isEmpty(row.invoice_number) ? null : row.invoice_number,
          invoice_date: isEmpty(row.invoice_date) ? new Date().toISOString().split('T')[0] : row.invoice_date,
          due_date: isEmpty(row.due_date) ? null : row.due_date,
          invoice_type: type,
          payment_type: paymentType,
          amount_ht: isEmpty(row.amount_ht) ? 0 : parseFloat(row.amount_ht),
          tva_rate: isEmpty(row.tva_rate) ? (type === 'formation' ? 0 : 20) : parseFloat(row.tva_rate),
          // amount_ttc is computed by the database, don't include it
          status: status,
          payment_date: isEmpty(row.payment_date) ? null : row.payment_date,
          payment_method: isEmpty(row.payment_method) ? null : row.payment_method,
          notes: isEmpty(row.notes) ? null : row.notes,
          inscription_id: sanitizedInscriptionId,
          related_invoice_id: sanitizedRelatedInvoiceId,
        };
      }
      
      default:
        throw new Error(`Table non supportée: ${table}`);
    }
  };

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'invoiced': 'Facturé',
      'completed': 'Terminé',
      'in_progress': 'En cours',
      'cancelled': 'Annulé',
    };
    return statusMap[status] || status || 'En cours';
  };

  const headers = preview.length > 0 ? Object.keys(preview[0]).slice(0, 10) : [];

  const tableLabels: Record<TableType, string> = {
    instructors: "1. Formateurs (instructors)",
    ski_schools: "2. Écoles de ski (ski_schools)",
    students: "3. Stagiaires (students)",
    inscriptions: "4. Inscriptions (inscriptions)",
    invoices: "5. Factures (invoices)",
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <FliInscriptionsImportCard />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Import de données CSV</h1>
            <p className="text-muted-foreground">
              Importez vos données propres table par table
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isPurging}>
                {isPurging ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Purger toutes les données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la purge des données</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action va supprimer TOUTES les données des tables suivantes dans l'ordre :
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>inscriptions</li>
                    <li>students</li>
                    <li>ski_schools</li>
                    <li>instructors</li>
                  </ul>
                  <br />
                  <strong className="text-destructive">Cette action est irréversible.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handlePurgeData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmer la purge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Table Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Sélection de la table</CardTitle>
            <CardDescription>
              Importez les tables dans l'ordre : 1. Formateurs → 2. Écoles → 3. Stagiaires → 4. Inscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTable} onValueChange={(v) => setSelectedTable(v as TableType)}>
              <SelectTrigger className="w-[400px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tableLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Fichier CSV - {tableLabels[selectedTable]}
            </CardTitle>
            <CardDescription>
              Format attendu : CSV avec séparateur virgule (,)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">
                    {file ? file.name : "Cliquez pour sélectionner un fichier"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {file ? `${allRows.length} enregistrements trouvés` : "CSV avec séparateur virgule (,)"}
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu (10 premiers enregistrements)</CardTitle>
              <CardDescription>
                Vérifiez que les données sont correctement lues avant d'importer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, index) => (
                      <TableRow key={index}>
                        {headers.map((header) => (
                          <TableCell key={header} className="max-w-[200px] truncate">
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importer {allRows.length} enregistrements dans {selectedTable}
                    </>
                  )}
                </Button>

                {isImporting && (
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">{progress}% terminé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Résultat de l'import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">{stats.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total lignes</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-green-600">{stats.imported}</p>
                  <p className="text-sm text-muted-foreground">Importés</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-red-600">{stats.errors.length}</p>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreurs d'import ({stats.errors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="max-h-[200px] overflow-y-auto mt-2 space-y-1 text-sm">
                      {stats.errors.slice(0, 50).map((error, i) => (
                        <p key={i}>• {error}</p>
                      ))}
                      {stats.errors.length > 50 && (
                        <p className="font-medium">... et {stats.errors.length - 50} autres erreurs</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions d'import</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li><strong>Purger d'abord</strong> toutes les données existantes avec le bouton rouge</li>
              <li>Importer <strong>instructors.csv</strong> (26 formateurs)</li>
              <li>Importer <strong>ski_schools.csv</strong> (16 écoles)</li>
              <li>Importer <strong>students.csv</strong> (582 stagiaires)</li>
              <li>Importer <strong>inscriptions.csv</strong> (871 inscriptions)</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Les colonnes sont mappées automatiquement. Les UUIDs dans les fichiers correspondent aux références entre tables.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

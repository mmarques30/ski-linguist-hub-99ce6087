import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CSVRow {
  [key: string]: string;
}

interface ImportStats {
  totalRows: number;
  studentsCreated: number;
  studentsReused: number;
  instructorsCreated: number;
  instructorsReused: number;
  skiSchoolsCreated: number;
  skiSchoolsReused: number;
  inscriptionsCreated: number;
  errors: string[];
}

// Parse CSV with semicolon separator
function parseCSV(text: string): CSVRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }
  
  const headers = headerLine.split(';').map(h => h.trim());
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    if (values.length < 5) continue; // Skip empty rows
    
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

// Parse French date format DD/MM/YYYY to ISO
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '-' || dateStr === 'N/A') return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

// Parse monetary value "630,00 €" or "1 100,00 €" to number
function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr === '-' || priceStr === 'N/A') return null;
  
  const cleaned = priceStr
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse "Nom et Prénom" into first_name and last_name
function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || fullName === '-' || fullName === 'N/A') {
    return { firstName: 'Desconhecido', lastName: 'Desconhecido' };
  }
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  // Last word is last name, rest is first name
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  
  return { firstName, lastName };
}

// Check if value is empty/null equivalent
function isEmpty(value: string): boolean {
  return !value || value === '-' || value === 'N/A' || value.trim() === '';
}

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [allRows, setAllRows] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
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

  const handleImport = async () => {
    if (allRows.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    const importStats: ImportStats = {
      totalRows: allRows.length,
      studentsCreated: 0,
      studentsReused: 0,
      instructorsCreated: 0,
      instructorsReused: 0,
      skiSchoolsCreated: 0,
      skiSchoolsReused: 0,
      inscriptionsCreated: 0,
      errors: [],
    };

    // Cache for lookups
    const studentCache = new Map<string, string>();
    const instructorCache = new Map<string, string>();
    const skiSchoolCache = new Map<string, string>();

    // Pre-fetch existing data
    const { data: existingStudents } = await supabase.from('students').select('id, email');
    existingStudents?.forEach(s => studentCache.set(s.email.toLowerCase(), s.id));

    const { data: existingInstructors } = await supabase.from('instructors').select('id, email');
    existingInstructors?.forEach(i => {
      if (i.email) instructorCache.set(i.email.toLowerCase(), i.id);
    });

    const { data: existingSchools } = await supabase.from('ski_schools').select('id, name');
    existingSchools?.forEach(s => skiSchoolCache.set(s.name.toLowerCase(), s.id));

    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      
      try {
        // 1. Process Student
        const email = row['Email']?.toLowerCase().trim();
        if (!email) {
          importStats.errors.push(`Linha ${i + 2}: Email do aluno não encontrado`);
          continue;
        }

        let studentId = studentCache.get(email);
        
        if (!studentId) {
          const { firstName, lastName } = parseName(row['Nom et Prénom']);
          
          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .insert({
              email,
              first_name: firstName,
              last_name: lastName,
              civility: row['Civilité'] || null,
              phone: row['Tél'] || null,
              street_address: row['Rue ou localité'] || null,
              postal_code: row['CP'] || null,
              city: row['Ville'] || null,
              company: isEmpty(row['Entreprise']) ? null : row['Entreprise'],
            })
            .select('id')
            .single();

          if (studentError) {
            importStats.errors.push(`Linha ${i + 2}: Erro ao criar aluno - ${studentError.message}`);
            continue;
          }

          studentId = newStudent.id;
          studentCache.set(email, studentId);
          importStats.studentsCreated++;
        } else {
          importStats.studentsReused++;
        }

        // 2. Process Instructor
        let instructorId: string | null = null;
        const instructorEmail = row['e-mail Prof']?.toLowerCase().trim();
        
        if (instructorEmail && !isEmpty(instructorEmail)) {
          instructorId = instructorCache.get(instructorEmail) || null;
          
          if (!instructorId) {
            const instructorName = row['Formateur'] || '';
            const nameParts = instructorName.trim().split(' ');
            const instructorFirstName = nameParts.slice(0, -1).join(' ') || '';
            const instructorLastName = nameParts[nameParts.length - 1] || 'Desconhecido';

            const { data: newInstructor, error: instructorError } = await supabase
              .from('instructors')
              .insert({
                email: instructorEmail,
                first_name: instructorFirstName,
                last_name: instructorLastName,
                phone: row['Tél Prof'] || null,
                languages: row['Langue'] ? [row['Langue']] : [],
              })
              .select('id')
              .single();

            if (!instructorError && newInstructor) {
              instructorId = newInstructor.id;
              instructorCache.set(instructorEmail, instructorId);
              importStats.instructorsCreated++;
            }
          } else {
            importStats.instructorsReused++;
          }
        }

        // 3. Process Ski School
        let skiSchoolId: string | null = null;
        const schoolName = row['École de SKI']?.trim();
        
        if (schoolName && !isEmpty(schoolName)) {
          skiSchoolId = skiSchoolCache.get(schoolName.toLowerCase()) || null;
          
          if (!skiSchoolId) {
            const { data: newSchool, error: schoolError } = await supabase
              .from('ski_schools')
              .insert({
                name: schoolName,
                director_name: isEmpty(row['Directeur de l\'école de ski']) ? null : row['Directeur de l\'école de ski'],
                director_phone: isEmpty(row['N° de Portable du Directeur']) ? null : row['N° de Portable du Directeur'],
              })
              .select('id')
              .single();

            if (!schoolError && newSchool) {
              skiSchoolId = newSchool.id;
              skiSchoolCache.set(schoolName.toLowerCase(), skiSchoolId);
              importStats.skiSchoolsCreated++;
            }
          } else {
            importStats.skiSchoolsReused++;
          }
        }

        // 4. Create Inscription
        const startDate = parseDate(row['Date début']);
        const endDate = parseDate(row['Date fin']);
        
        if (!startDate || !endDate) {
          importStats.errors.push(`Linha ${i + 2}: Datas inválidas`);
          continue;
        }

        const { error: inscriptionError } = await supabase
          .from('inscriptions')
          .insert({
            student_id: studentId,
            instructor_id: instructorId,
            ski_school_id: skiSchoolId,
            modality: row['Modalité'] || null,
            course_type: row['Type'] || null,
            max_participants: row['Effectif'] || null,
            language: row['Langue'] || 'Não especificado',
            certification_type: isEmpty(row['Certification']) ? null : row['Certification'],
            course_location: isEmpty(row['Lieu du stage']) ? null : row['Lieu du stage'],
            course_address: isEmpty(row['Adresse du stage']) ? null : row['Adresse du stage'],
            start_date: startDate,
            end_date: endDate,
            duration_hours: parsePrice(row['Durée (en heures)']),
            duration_days: parsePrice(row['Durée (en jours)']),
            hours_per_day: parsePrice(row['Heures par jour']),
            schedule: isEmpty(row['Horaires']) ? null : row['Horaires'],
            rhythm: isEmpty(row['Rythme']) ? null : row['Rythme'],
            entry_test_score: isEmpty(row['Résultat test - entrée']) ? null : row['Résultat test - entrée'],
            entry_level: isEmpty(row['Niveau entrée']) ? null : row['Niveau entrée'],
            group_name: isEmpty(row['Groupe']) ? null : row['Groupe'],
            final_general_level: isEmpty(row['Niv géneral en fin de stage']) ? null : row['Niv géneral en fin de stage'],
            final_specific_level: isEmpty(row['Niv spécifique']) ? null : row['Niv spécifique'],
            certification_date: parseDate(row['Date de la certification']),
            certification_result: isEmpty(row['Résultat Certif Baréme Européen']) ? null : row['Résultat Certif Baréme Européen'],
            pedagogical_cost: parsePrice(row['Coût pédagogique']),
            price: parsePrice(row[' € ']),
            payment_method: isEmpty(row[' Mode de paiement acompte 1 ']) ? null : row[' Mode de paiement acompte 1 '],
            deposit_amount: parsePrice(row[' Acompte ']),
            deposit_date: parseDate(row['Date Acompte']),
            check_number: isEmpty(row['Chèque']) ? null : row['Chèque'],
            check_date: parseDate(row['Date d\'émission du chèque']),
            balance_after_deposit: parsePrice(row[' Solde après acompte ']),
            status: row['Status'] || 'En cours',
            final_status: isEmpty(row['Status final']) ? null : row['Status final'],
            qualiopi_status: isEmpty(row['QUALIOPI']) ? null : row['QUALIOPI'],
            expectations: isEmpty(row['Attentes']) ? null : row['Attentes'],
            observations: isEmpty(row['Observation']) ? null : row['Observation'],
            course_materials: isEmpty(row['Support de cours']) ? null : row['Support de cours'],
            code: isEmpty(row['Code']) ? null : row['Code'],
          });

        if (inscriptionError) {
          importStats.errors.push(`Linha ${i + 2}: Erro ao criar inscrição - ${inscriptionError.message}`);
        } else {
          importStats.inscriptionsCreated++;
        }

      } catch (error) {
        importStats.errors.push(`Linha ${i + 2}: Erro inesperado - ${error}`);
      }

      setProgress(Math.round(((i + 1) / allRows.length) * 100));
    }

    setStats(importStats);
    setIsImporting(false);
    
    toast({
      title: "Importação concluída!",
      description: `${importStats.inscriptionsCreated} inscrições importadas com sucesso.`,
    });
  };

  const headers = preview.length > 0 ? Object.keys(preview[0]).slice(0, 8) : [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Importar Dados CSV</h1>
          <p className="text-muted-foreground">
            Importe dados históricos de inscrições a partir de um arquivo CSV
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Arquivo CSV
            </CardTitle>
            <CardDescription>
              Selecione o arquivo CSV com os dados de inscrições. O separador deve ser ponto e vírgula (;)
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
                    {file ? file.name : "Clique para selecionar um arquivo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {file ? `${allRows.length} registros encontrados` : "CSV com separador ponto e vírgula (;)"}
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
              <CardTitle>Preview (primeiros 10 registros)</CardTitle>
              <CardDescription>
                Verifique se os dados estão sendo lidos corretamente antes de importar
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
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar {allRows.length} Registros
                    </>
                  )}
                </Button>

                {isImporting && (
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-1">{progress}% concluído</p>
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
                Resultado da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-2xl font-bold">{stats.inscriptionsCreated}</p>
                  <p className="text-sm text-muted-foreground">Inscrições Criadas</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-2xl font-bold">{stats.studentsCreated}</p>
                  <p className="text-sm text-muted-foreground">Novos Alunos</p>
                  <Badge variant="secondary" className="mt-1">{stats.studentsReused} reutilizados</Badge>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-2xl font-bold">{stats.instructorsCreated}</p>
                  <p className="text-sm text-muted-foreground">Novos Instrutores</p>
                  <Badge variant="secondary" className="mt-1">{stats.instructorsReused} reutilizados</Badge>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-2xl font-bold">{stats.skiSchoolsCreated}</p>
                  <p className="text-sm text-muted-foreground">Novas Escolas</p>
                  <Badge variant="secondary" className="mt-1">{stats.skiSchoolsReused} reutilizadas</Badge>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erros durante a importação ({stats.errors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-40 overflow-y-auto">
                      {stats.errors.slice(0, 20).map((error, index) => (
                        <p key={index} className="text-sm">{error}</p>
                      ))}
                      {stats.errors.length > 20 && (
                        <p className="text-sm font-medium mt-2">
                          ... e mais {stats.errors.length - 20} erros
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

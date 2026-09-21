import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { useCurrentSeason, usePriceLookup } from "@/hooks/useSeasons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeCaughtError } from "@/lib/supabase-error";
import { studentEmailLabel } from "@/lib/email-guards";
import { buildStudentSearchFilter } from "@/hooks/useStudents";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { FUNDING_ORGANIZATION_OPTIONS } from "@/lib/opco-funding";

const translations = {
  titleCreate: {
    fr: "Nouvelle inscription",
    "pt-BR": "Nova inscrição",
    en: "New Enrollment"
  },
  titleEdit: {
    fr: "Modifier l'inscription",
    "pt-BR": "Editar inscrição",
    en: "Edit Enrollment"
  },
  descriptionCreate: {
    fr: "Créez une nouvelle inscription pour un stagiaire.",
    "pt-BR": "Crie uma nova inscrição para um estagiário.",
    en: "Create a new enrollment for a student."
  },
  descriptionEdit: {
    fr: "Modifiez les informations de l'inscription.",
    "pt-BR": "Edite as informações da inscrição.",
    en: "Edit the enrollment information."
  },
  student: {
    fr: "Stagiaire",
    "pt-BR": "Estagiário",
    en: "Student"
  },
  selectStudent: {
    fr: "Sélectionner un stagiaire",
    "pt-BR": "Selecionar um estagiário",
    en: "Select a student"
  },
  instructor: {
    fr: "Formateur",
    "pt-BR": "Formador",
    en: "Instructor"
  },
  selectInstructor: {
    fr: "Sélectionner un formateur",
    "pt-BR": "Selecionar um formador",
    en: "Select an instructor"
  },
  skiSchool: {
    fr: "École de ski",
    "pt-BR": "Escola de ski",
    en: "Ski School"
  },
  selectSkiSchool: {
    fr: "Sélectionner une école",
    "pt-BR": "Selecionar uma escola",
    en: "Select a school"
  },
  language: {
    fr: "Langue de formation",
    "pt-BR": "Idioma de formação",
    en: "Training Language"
  },
  selectLanguage: {
    fr: "Sélectionner une langue",
    "pt-BR": "Selecionar um idioma",
    en: "Select a language"
  },
  startDate: {
    fr: "Date de début",
    "pt-BR": "Data de início",
    en: "Start Date"
  },
  endDate: {
    fr: "Date de fin",
    "pt-BR": "Data de término",
    en: "End Date"
  },
  durationHours: {
    fr: "Durée (heures)",
    "pt-BR": "Duração (horas)",
    en: "Duration (hours)"
  },
  price: {
    fr: "Prix (€)",
    "pt-BR": "Preço (€)",
    en: "Price (€)"
  },
  entryLevel: {
    fr: "Niveau d'entrée",
    "pt-BR": "Nível de entrada",
    en: "Entry Level"
  },
  modality: {
    fr: "Modalité",
    "pt-BR": "Modalidade",
    en: "Modality"
  },
  location: {
    fr: "Lieu de formation",
    "pt-BR": "Local de formação",
    en: "Training Location"
  },
  observations: {
    fr: "Observations",
    "pt-BR": "Observações",
    en: "Observations"
  },
  cancel: {
    fr: "Annuler",
    "pt-BR": "Cancelar",
    en: "Cancel"
  },
  create: {
    fr: "Créer l'inscription",
    "pt-BR": "Criar inscrição",
    en: "Create Enrollment"
  },
  save: {
    fr: "Enregistrer",
    "pt-BR": "Salvar",
    en: "Save"
  },
  creating: {
    fr: "Création...",
    "pt-BR": "Criando...",
    en: "Creating..."
  },
  saving: {
    fr: "Enregistrement...",
    "pt-BR": "Salvando...",
    en: "Saving..."
  },
  successCreate: {
    fr: "Inscription créée avec succès",
    "pt-BR": "Inscrição criada com sucesso",
    en: "Enrollment created successfully"
  },
  successEdit: {
    fr: "Inscription modifiée avec succès",
    "pt-BR": "Inscrição modificada com sucesso",
    en: "Enrollment updated successfully"
  },
  errorCreate: {
    fr: "Erreur lors de la création",
    "pt-BR": "Erro ao criar",
    en: "Error creating enrollment"
  },
  errorEdit: {
    fr: "Erreur lors de la modification",
    "pt-BR": "Erro ao modificar",
    en: "Error updating enrollment"
  },
  codeGenerated: {
    fr: "Code généré automatiquement",
    "pt-BR": "Código gerado automaticamente",
    en: "Code generated automatically"
  },
  none: {
    fr: "Aucun",
    "pt-BR": "Nenhum",
    en: "None"
  },
  inPerson: {
    fr: "Présentiel",
    "pt-BR": "Presencial",
    en: "In-Person"
  },
  remote: {
    fr: "Distanciel",
    "pt-BR": "Remoto",
    en: "Remote"
  },
  hybrid: {
    fr: "Hybride",
    "pt-BR": "Híbrido",
    en: "Hybrid"
  }
};

const languages = [
  { value: "Anglais", label: { fr: "Anglais", "pt-BR": "Inglês", en: "English" } },
  { value: "Portugais brésilien", label: { fr: "Portugais brésilien", "pt-BR": "Português brasileiro", en: "Brazilian Portuguese" } },
  { value: "Italien", label: { fr: "Italien", "pt-BR": "Italiano", en: "Italian" } },
  { value: "Allemand", label: { fr: "Allemand", "pt-BR": "Alemão", en: "German" } },
  { value: "Espagnol", label: { fr: "Espagnol", "pt-BR": "Espanhol", en: "Spanish" } },
];

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

const inscriptionSchema = z.object({
  student_id: z.string().min(1, "Required"),
  instructor_id: z.string().optional(),
  ski_school_id: z.string().optional(),
  language: z.string().min(1, "Required"),
  start_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  duration_hours: z.coerce.number().optional(),
  duration_days: z.coerce.number().optional(),
  hours_per_day: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  pedagogical_cost: z.coerce.number().optional(),
  entry_level: z.string().optional(),
  exit_level: z.string().optional(),
  modality: z.string().optional(),
  course_location: z.string().optional(),
  observations: z.string().optional(),
  expectations: z.string().optional(),
  funding_organization: z.string().optional(),
  group_name: z.string().optional(),
  groupe_code: z.string().optional(),
  dates_to_confirm: z.boolean().optional(),
  certification_type: z.string().optional(),
  certification_result: z.string().optional(),
  certification_date: z.string().optional(),
});

type InscriptionFormData = z.infer<typeof inscriptionSchema>;

interface InscriptionToEdit {
  id: string;
  student_id?: string | null;
  instructor_id?: string | null;
  ski_school_id?: string | null;
  language: string;
  start_date: string;
  end_date: string;
  duration_hours?: number | null;
  duration_days?: number | null;
  hours_per_day?: number | null;
  price?: number | null;
  pedagogical_cost?: number | null;
  entry_level?: string | null;
  exit_level?: string | null;
  modality?: string | null;
  course_location?: string | null;
  observations?: string | null;
  expectations?: string | null;
  funding_organization?: string | null;
  group_name?: string | null;
  groupe_code?: string | null;
  dates_to_confirm?: boolean | null;
  certification_type?: string | null;
  certification_result?: string | null;
  certification_date?: string | null;
}

interface InscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscription?: InscriptionToEdit | null;
}

export function InscriptionFormDialog({ open, onOpenChange, inscription }: InscriptionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const queryClient = useQueryClient();
  const { t, language: uiLanguage } = useLanguage();
  const isEditMode = !!inscription;
  const { data: currentSeason } = useCurrentSeason();
  const { confirm, dialog: confirmDialog } = useConfirmAction();

  const form = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      student_id: "",
      instructor_id: "",
      ski_school_id: "",
      language: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: "",
      duration_hours: undefined,
      duration_days: undefined,
      hours_per_day: undefined,
      price: undefined,
      pedagogical_cost: undefined,
      entry_level: "",
      exit_level: "",
      modality: "Présentiel",
      course_location: "",
      observations: "",
      expectations: "",
      funding_organization: "",
      group_name: "",
      groupe_code: "",
      dates_to_confirm: false,
      certification_type: "",
      certification_result: "",
      certification_date: "",
    },
  });

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ["students-select", studentSearch],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("id, first_name, last_name, email, company")
        .order("last_name")
        .limit(50);
      
      const searchFilter = buildStudentSearchFilter(studentSearch);
      if (searchFilter) {
        query = query.or(searchFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch instructors
  const { data: instructors } = useQuery({
    queryKey: ["instructors-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructors")
        .select("id, first_name, last_name, email")
        .eq("status", "actif")
        .order("last_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch ski schools
  const { data: skiSchools } = useQuery({
    queryKey: ["ski-schools-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ski_schools")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && inscription) {
      form.reset({
        student_id: inscription.student_id || "",
        instructor_id: inscription.instructor_id || "",
        ski_school_id: inscription.ski_school_id || "",
        language: inscription.language || "",
        start_date: inscription.start_date || "",
        end_date: inscription.end_date || "",
        duration_hours: inscription.duration_hours ?? undefined,
        duration_days: inscription.duration_days ?? undefined,
        hours_per_day: inscription.hours_per_day ?? undefined,
        price: inscription.price ?? undefined,
        pedagogical_cost: inscription.pedagogical_cost ?? undefined,
        entry_level: inscription.entry_level || "",
        exit_level: inscription.exit_level || "",
        modality: inscription.modality || "Présentiel",
        course_location: inscription.course_location || "",
        observations: inscription.observations || "",
        expectations: inscription.expectations || "",
        funding_organization: inscription.funding_organization || "",
        group_name: inscription.group_name || "",
        groupe_code: inscription.groupe_code || "",
        dates_to_confirm: !!inscription.dates_to_confirm,
        certification_type: inscription.certification_type || "",
        certification_result: inscription.certification_result || "",
        certification_date: inscription.certification_date
          ? inscription.certification_date.slice(0, 10)
          : "",
      });
    } else if (!open) {
      form.reset();
      setStudentSearch("");
    }
  }, [open, inscription, form]);

  // Price lookup from season pricing rules
  const watchedLanguage = form.watch("language");
  const watchedLevel = form.watch("entry_level");
  const watchedModality = form.watch("modality");
  const watchedDuration = form.watch("duration_hours");

  const { data: priceLookup } = usePriceLookup(
    currentSeason?.id,
    watchedLanguage,
    watchedLevel,
    watchedModality,
    watchedDuration
  );

  useEffect(() => {
    if (priceLookup?.base_price && !isEditMode) {
      form.setValue("price", Number(priceLookup.base_price));
    }
  }, [priceLookup, isEditMode]);

  const persistInscription = async (data: InscriptionFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        student_id: data.student_id,
        instructor_id: data.instructor_id === "none" ? null : data.instructor_id || null,
        ski_school_id: data.ski_school_id === "none" ? null : data.ski_school_id || null,
        language: data.language,
        start_date: data.start_date,
        end_date: data.end_date,
        duration_hours: data.duration_hours || null,
        duration_days: data.duration_days || null,
        hours_per_day: data.hours_per_day || null,
        price: data.price || null,
        pedagogical_cost: data.pedagogical_cost || null,
        entry_level: data.entry_level || null,
        exit_level: data.exit_level || null,
        modality: data.modality || null,
        course_location: data.course_location || null,
        observations: data.observations || null,
        expectations: data.expectations || null,
        funding_organization: data.funding_organization || null,
        group_name: data.group_name || null,
        groupe_code: data.groupe_code || null,
        dates_to_confirm: !!data.dates_to_confirm,
        certification_type: data.certification_type || null,
        certification_result: data.certification_result || null,
        certification_date: data.certification_date || null,
      };

      if (isEditMode && inscription) {
        const { error } = await supabase
          .from("inscriptions")
          .update(payload)
          .eq("id", inscription.id);

        if (error) throw error;
        toast.success(t(translations.successEdit));
      } else {
        const { data: codeResult, error: codeError } = await supabase.rpc(
          "generate_inscription_code"
        );

        if (codeError) throw codeError;

        const { error } = await supabase.from("inscriptions").insert({
          ...payload,
          code: codeResult,
          season_id: currentSeason?.id || null,
          status: "brouillon",
        });

        if (error) throw error;
        toast.success(t(translations.successCreate));
      }

      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-details"] });
      queryClient.invalidateQueries({ queryKey: ["inscription"] });
      queryClient.invalidateQueries({ queryKey: ["inscription-ops-fields"] });
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error saving inscription:", error);
      const described = describeCaughtError(error);
      toast.error(
        isEditMode
          ? t(translations.errorEdit)
          : described.message && described.message !== "Erreur interne"
            ? described.message
            : t(translations.errorCreate)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: InscriptionFormData) => {
    confirm({
      title: isEditMode ? "Enregistrer les modifications ?" : "Créer cette inscription ?",
      description: isEditMode
        ? "Toutes les infos de la fiche (stagiaire, formation, montants, niveaux, groupe, certification) seront mises à jour."
        : "Une nouvelle inscription brouillon sera créée avec les informations saisies.",
      actionLabel: isEditMode ? t(translations.save) : t(translations.create),
      run: () => persistInscription(data),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t(translations.titleEdit) : t(translations.titleCreate)}</DialogTitle>
          <DialogDescription>{isEditMode ? t(translations.descriptionEdit) : t(translations.descriptionCreate)}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.student)} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t(translations.selectStudent)} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher..."
                            className="pl-8 h-8"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} - {studentEmailLabel(student.email)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Instructor Selection */}
              <FormField
                control={form.control}
                name="instructor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.instructor)}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t(translations.selectInstructor)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t(translations.none)}</SelectItem>
                        {instructors?.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ski School Selection */}
              <FormField
                control={form.control}
                name="ski_school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.skiSchool)}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t(translations.selectSkiSchool)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t(translations.none)}</SelectItem>
                        {skiSchools?.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.language)} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t(translations.selectLanguage)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label[uiLanguage as keyof typeof lang.label] || lang.label.fr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entry Level */}
              <FormField
                control={form.control}
                name="entry_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.entryLevel)}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="CECRL" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.startDate)} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.endDate)} *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Duration */}
              <FormField
                control={form.control}
                name="duration_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.durationHours)}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      {t(translations.price)}
                      {priceLookup && currentSeason && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 cursor-help">
                              Tarif {currentSeason.name}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Prix auto-rempli depuis la grille tarifaire de la saison</TooltipContent>
                        </Tooltip>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modality */}
              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.modality)}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Présentiel">{t(translations.inPerson)}</SelectItem>
                        <SelectItem value="Distanciel">{t(translations.remote)}</SelectItem>
                        <SelectItem value="Hybride">{t(translations.hybrid)}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="course_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.location)}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Financement */}
            <FormField
              control={form.control}
              name="funding_organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financement</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    value={field.value || "__none__"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Mode de financement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Non renseigné</SelectItem>
                      {FUNDING_ORGANIZATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée (jours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hours_per_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heures / jour</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pedagogical_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût pédagogique €</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exit_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau sortie</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      value={field.value || "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {levels.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Groupe (libellé)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="groupe_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code groupe</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dates_to_confirm"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dates à confirmer</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Cochez si les dates restent flexibles / à valider avec le client.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="certification_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certification_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résultat</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="B2…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="certification_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date certif.</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observations */}
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.observations)}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attentes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditMode && (
              <p className="text-xs text-muted-foreground italic">
                {t(translations.codeGenerated)}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t(translations.cancel)}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? t(translations.saving) : t(translations.creating)}
                  </>
                ) : (
                  isEditMode ? t(translations.save) : t(translations.create)
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}

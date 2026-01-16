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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  createTitle: {
    fr: "Nouveau stagiaire",
    "pt-BR": "Novo estagiário",
    en: "New Student"
  },
  editTitle: {
    fr: "Modifier le stagiaire",
    "pt-BR": "Editar estagiário",
    en: "Edit Student"
  },
  createDescription: {
    fr: "Remplissez les informations pour créer un nouveau stagiaire.",
    "pt-BR": "Preencha as informações para criar um novo estagiário.",
    en: "Fill in the information to create a new student."
  },
  editDescription: {
    fr: "Modifiez les informations du stagiaire.",
    "pt-BR": "Modifique as informações do estagiário.",
    en: "Modify the student information."
  },
  civility: {
    fr: "Civilité",
    "pt-BR": "Tratamento",
    en: "Title"
  },
  firstName: {
    fr: "Prénom",
    "pt-BR": "Nome",
    en: "First Name"
  },
  lastName: {
    fr: "Nom",
    "pt-BR": "Sobrenome",
    en: "Last Name"
  },
  email: {
    fr: "Email",
    "pt-BR": "Email",
    en: "Email"
  },
  phone: {
    fr: "Téléphone",
    "pt-BR": "Telefone",
    en: "Phone"
  },
  company: {
    fr: "Entreprise",
    "pt-BR": "Empresa",
    en: "Company"
  },
  streetAddress: {
    fr: "Adresse",
    "pt-BR": "Endereço",
    en: "Street Address"
  },
  postalCode: {
    fr: "Code postal",
    "pt-BR": "CEP",
    en: "Postal Code"
  },
  city: {
    fr: "Ville",
    "pt-BR": "Cidade",
    en: "City"
  },
  cancel: {
    fr: "Annuler",
    "pt-BR": "Cancelar",
    en: "Cancel"
  },
  save: {
    fr: "Enregistrer",
    "pt-BR": "Salvar",
    en: "Save"
  },
  create: {
    fr: "Créer",
    "pt-BR": "Criar",
    en: "Create"
  },
  saving: {
    fr: "Enregistrement...",
    "pt-BR": "Salvando...",
    en: "Saving..."
  },
  successCreate: {
    fr: "Stagiaire créé avec succès",
    "pt-BR": "Estagiário criado com sucesso",
    en: "Student created successfully"
  },
  successEdit: {
    fr: "Stagiaire modifié avec succès",
    "pt-BR": "Estagiário modificado com sucesso",
    en: "Student updated successfully"
  },
  errorCreate: {
    fr: "Erreur lors de la création du stagiaire",
    "pt-BR": "Erro ao criar estagiário",
    en: "Error creating student"
  },
  errorEdit: {
    fr: "Erreur lors de la modification du stagiaire",
    "pt-BR": "Erro ao modificar estagiário",
    en: "Error updating student"
  },
  mr: {
    fr: "M.",
    "pt-BR": "Sr.",
    en: "Mr."
  },
  mrs: {
    fr: "Mme",
    "pt-BR": "Sra.",
    en: "Mrs."
  },
  select: {
    fr: "Sélectionner",
    "pt-BR": "Selecionar",
    en: "Select"
  },
  required: {
    fr: "Ce champ est obligatoire",
    "pt-BR": "Este campo é obrigatório",
    en: "This field is required"
  },
  invalidEmail: {
    fr: "Email invalide",
    "pt-BR": "Email inválido",
    en: "Invalid email"
  }
};

const studentSchema = z.object({
  civility: z.string().optional(),
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  street_address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: {
    id: string;
    civility: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
  } | null;
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const isEditing = !!student;

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      civility: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      street_address: "",
      postal_code: "",
      city: "",
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        civility: student.civility || "",
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone || "",
        company: student.company || "",
        street_address: student.street_address || "",
        postal_code: student.postal_code || "",
        city: student.city || "",
      });
    } else {
      form.reset({
        civility: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company: "",
        street_address: "",
        postal_code: "",
        city: "",
      });
    }
  }, [student, form, open]);

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && student) {
        const { error } = await supabase
          .from("students")
          .update({
            civility: data.civility || null,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            street_address: data.street_address || null,
            postal_code: data.postal_code || null,
            city: data.city || null,
          })
          .eq("id", student.id);

        if (error) throw error;
        toast.success(t(translations.successEdit));
      } else {
        const { error } = await supabase.from("students").insert({
          civility: data.civility || null,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          street_address: data.street_address || null,
          postal_code: data.postal_code || null,
          city: data.city || null,
        });

        if (error) throw error;
        toast.success(t(translations.successCreate));
      }

      queryClient.invalidateQueries({ queryKey: ["students"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(isEditing ? t(translations.errorEdit) : t(translations.errorCreate));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t(translations.editTitle) : t(translations.createTitle)}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t(translations.editDescription) : t(translations.createDescription)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="civility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.civility)}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t(translations.select)} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M.">{t(translations.mr)}</SelectItem>
                        <SelectItem value="Mme">{t(translations.mrs)}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>{t(translations.firstName)} *</FormLabel>
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
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.lastName)} *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.email)} *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.phone)}</FormLabel>
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
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.company)}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.streetAddress)}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(translations.postalCode)}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t(translations.city)}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    {t(translations.saving)}
                  </>
                ) : isEditing ? (
                  t(translations.save)
                ) : (
                  t(translations.create)
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

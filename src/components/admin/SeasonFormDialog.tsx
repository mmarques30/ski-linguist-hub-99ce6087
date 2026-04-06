import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCreateSeason, useUpdateSeason, type Season } from "@/hooks/useSeasons";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  create: { fr: "Nouvelle saison", "pt-BR": "Nova temporada", en: "New Season" },
  edit: { fr: "Modifier la saison", "pt-BR": "Editar temporada", en: "Edit Season" },
  name: { fr: "Nom", "pt-BR": "Nome", en: "Name" },
  namePlaceholder: { fr: "ex: Hiver 2025-2026", "pt-BR": "ex: Inverno 2025-2026", en: "e.g. Winter 2025-2026" },
  startDate: { fr: "Date de début", "pt-BR": "Data de início", en: "Start Date" },
  endDate: { fr: "Date de fin", "pt-BR": "Data de término", en: "End Date" },
  revenueTarget: { fr: "Objectif CA (€)", "pt-BR": "Meta de receita (€)", en: "Revenue Target (€)" },
  notes: { fr: "Notes", "pt-BR": "Notas", en: "Notes" },
  cancel: { fr: "Annuler", "pt-BR": "Cancelar", en: "Cancel" },
  save: { fr: "Enregistrer", "pt-BR": "Salvar", en: "Save" },
  saving: { fr: "Enregistrement...", "pt-BR": "Salvando...", en: "Saving..." },
  success: { fr: "Saison enregistrée", "pt-BR": "Temporada salva", en: "Season saved" },
};

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const schema = z.object({
  name: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  revenue_target: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season?: Season | null;
}

export function SeasonFormDialog({ open, onOpenChange, season }: Props) {
  const { t } = useLanguage();
  const createMutation = useCreateSeason();
  const updateMutation = useUpdateSeason();
  const isEdit = !!season;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", start_date: "", end_date: "", revenue_target: 0, notes: "" },
  });

  useEffect(() => {
    if (open && season) {
      form.reset({
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date,
        revenue_target: Number(season.revenue_target) || 0,
        notes: season.notes || "",
      });
    } else if (!open) {
      form.reset({ name: "", start_date: "", end_date: "", revenue_target: 0, notes: "" });
    }
  }, [open, season]);

  const onSubmit = async (data: FormData) => {
    try {
      const slug = slugify(data.name);
      if (isEdit && season) {
        await updateMutation.mutateAsync({ id: season.id, ...data, slug });
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          slug,
          revenue_target: data.revenue_target ?? 0,
          notes: data.notes ?? null,
        });
      }
      toast.success(t(translations.success));
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t(translations.edit) : t(translations.create)}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t(translations.name)}</FormLabel>
                <FormControl><Input placeholder={t(translations.namePlaceholder)} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.startDate)}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(translations.endDate)}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="revenue_target" render={({ field }) => (
              <FormItem>
                <FormLabel>{t(translations.revenueTarget)}</FormLabel>
                <FormControl><Input type="number" min={0} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t(translations.notes)}</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t(translations.cancel)}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isPending ? t(translations.saving) : t(translations.save)}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

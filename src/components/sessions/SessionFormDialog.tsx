import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useCreateSession, useUpdateSession, checkInstructorConflict, type Session } from "@/hooks/useSessions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

const LANGUAGES = ["Anglais", "Portugais brésilien", "Italien", "Allemand", "Espagnol", "Russe", "Néerlandais"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MODALITIES = ["individuel", "groupe", "intensif"];
const STATUSES = ["planifiee", "en_cours", "terminee", "annulee"];

const schema = z.object({
  title: z.string().min(1),
  language: z.string().min(1),
  level: z.string().min(1),
  modality: z.string().min(1),
  max_students: z.coerce.number().min(1),
  start_datetime: z.string().min(1),
  end_datetime: z.string().min(1),
  instructor_id: z.string().optional(),
  location: z.string().optional(),
  room: z.string().optional(),
  recurrence: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session | null;
  defaultStart?: Date | null;
}

export function SessionFormDialog({ open, onOpenChange, session, defaultStart }: Props) {
  const { t } = useLanguage();
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const isEdit = !!session;
  const [conflict, setConflict] = useState<string | null>(null);

  const { data: instructors } = useQuery({
    queryKey: ["instructors-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructors")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("last_name");
      return data || [];
    },
    enabled: open,
  });

  const defaultStartStr = defaultStart
    ? format(defaultStart, "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'09:00");
  const defaultEndStr = defaultStart
    ? format(new Date(defaultStart.getTime() + 2 * 3600000), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'11:00");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      language: "Anglais",
      level: "A1",
      modality: "individuel",
      max_students: 1,
      start_datetime: defaultStartStr,
      end_datetime: defaultEndStr,
      instructor_id: "",
      location: "",
      room: "",
      recurrence: "",
      status: "planifiee",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && session) {
      form.reset({
        title: session.title,
        language: session.language,
        level: session.level,
        modality: session.modality,
        max_students: session.max_students,
        start_datetime: session.start_datetime.slice(0, 16),
        end_datetime: session.end_datetime.slice(0, 16),
        instructor_id: session.instructor_id || "",
        location: session.location || "",
        room: session.room || "",
        recurrence: session.recurrence || "",
        status: session.status,
        notes: session.notes || "",
      });
    } else if (open && !session) {
      form.reset({
        title: "",
        language: "Anglais",
        level: "A1",
        modality: "individuel",
        max_students: 1,
        start_datetime: defaultStartStr,
        end_datetime: defaultEndStr,
        instructor_id: "",
        location: "",
        room: "",
        recurrence: "",
        status: "planifiee",
        notes: "",
      });
    }
    setConflict(null);
  }, [open, session]);

  const onSubmit = async (data: FormData) => {
    setConflict(null);

    // Check instructor conflict
    if (data.instructor_id && data.instructor_id !== "none") {
      const hasConflict = await checkInstructorConflict(
        data.instructor_id,
        new Date(data.start_datetime).toISOString(),
        new Date(data.end_datetime).toISOString(),
        session?.id
      );
      if (hasConflict) {
        setConflict("Ce formateur a déjà une session au même créneau !");
        return;
      }
    }

    try {
      const payload = {
        title: data.title,
        language: data.language,
        level: data.level,
        modality: data.modality,
        max_students: data.max_students,
        start_datetime: new Date(data.start_datetime).toISOString(),
        end_datetime: new Date(data.end_datetime).toISOString(),
        instructor_id: data.instructor_id === "none" || !data.instructor_id ? null : data.instructor_id,
        location: data.location || null,
        room: data.room || null,
        recurrence: data.recurrence || null,
        status: data.status || "planifiee",
        notes: data.notes || null,
        season_id: null,
      };

      if (isEdit && session) {
        await updateMutation.mutateAsync({ id: session.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      toast.success(isEdit ? "Session modifiée" : "Session créée");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la session" : "Nouvelle session"}</DialogTitle>
        </DialogHeader>

        {conflict && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{conflict}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titre *</FormLabel>
                <FormControl><Input placeholder="ex: Anglais B1 - Groupe Matin" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="language" render={({ field }) => (
                <FormItem>
                  <FormLabel>Langue *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="modality" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalité *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="start_datetime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Début *</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_datetime" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin *</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="instructor_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Formateur</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {instructors?.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.first_name} {i.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="max_students" render={({ field }) => (
                <FormItem>
                  <FormLabel>Places max *</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu</FormLabel>
                  <FormControl><Input placeholder="Val d'Isère" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="room" render={({ field }) => (
                <FormItem>
                  <FormLabel>Salle</FormLabel>
                  <FormControl><Input placeholder="Salle A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recurrence" render={({ field }) => (
                <FormItem>
                  <FormLabel>Récurrence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {isEdit && (
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

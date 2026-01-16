import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContinuousImprovement, ContinuousImprovementFormData, ImprovementType, ImprovementStatus } from "@/hooks/useContinuousImprovement";

const improvementTypes: { value: ImprovementType; label: string }[] = [
  { value: 'VEILLE_PEDAGOGIQUE', label: 'Veille pédagogique' },
  { value: 'VEILLE_REGLEMENTAIRE', label: 'Veille réglementaire' },
  { value: 'VEILLE_FINANCIERE', label: 'Veille financière' },
  { value: 'AMELIORATION', label: 'Amélioration' },
  { value: 'RECLAMATION', label: 'Réclamation' },
];

const improvementStatuses: { value: ImprovementStatus; label: string }[] = [
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ABANDONNE', label: 'Abandonné' },
];

const formSchema = z.object({
  type: z.enum(['VEILLE_PEDAGOGIQUE', 'VEILLE_REGLEMENTAIRE', 'VEILLE_FINANCIERE', 'AMELIORATION', 'RECLAMATION']),
  theme: z.string().optional(),
  source: z.string().optional(),
  problem: z.string().optional(),
  action: z.string().min(1, "L'action est requise"),
  status: z.enum(['EN_COURS', 'TERMINE', 'ABANDONNE']),
  start_date: z.string().min(1, "La date de début est requise"),
  end_date: z.string().optional(),
});

interface ImprovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  improvement?: ContinuousImprovement | null;
  onSubmit: (data: ContinuousImprovementFormData) => void;
  isLoading?: boolean;
}

export function ImprovementFormDialog({
  open,
  onOpenChange,
  improvement,
  onSubmit,
  isLoading,
}: ImprovementFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'AMELIORATION',
      theme: '',
      source: '',
      problem: '',
      action: '',
      status: 'EN_COURS',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    },
  });

  useEffect(() => {
    if (improvement) {
      form.reset({
        type: improvement.type,
        theme: improvement.theme || '',
        source: improvement.source || '',
        problem: improvement.problem || '',
        action: improvement.action,
        status: improvement.status,
        start_date: improvement.start_date,
        end_date: improvement.end_date || '',
      });
    } else {
      form.reset({
        type: 'AMELIORATION',
        theme: '',
        source: '',
        problem: '',
        action: '',
        status: 'EN_COURS',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
    }
  }, [improvement, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as ContinuousImprovementFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {improvement ? "Modifier l'action" : "Nouvelle action d'amélioration"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {improvementTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {improvementStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thème</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Formation, Processus..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Audit, Questionnaire satisfaction..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problème identifié</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez le problème ou l'opportunité d'amélioration..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action corrective / préventive *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez l'action à mettre en place..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {improvement ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

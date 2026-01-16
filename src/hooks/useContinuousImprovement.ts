import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ImprovementType = 'VEILLE_PEDAGOGIQUE' | 'VEILLE_REGLEMENTAIRE' | 'VEILLE_FINANCIERE' | 'AMELIORATION' | 'RECLAMATION';
export type ImprovementStatus = 'EN_COURS' | 'TERMINE' | 'ABANDONNE';

export interface ContinuousImprovement {
  id: string;
  type: ImprovementType;
  theme: string | null;
  source: string | null;
  problem: string | null;
  action: string;
  status: ImprovementStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContinuousImprovementFormData {
  type: ImprovementType;
  theme?: string;
  source?: string;
  problem?: string;
  action: string;
  status: ImprovementStatus;
  start_date: string;
  end_date?: string;
}

export function useContinuousImprovement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: improvements, isLoading } = useQuery({
    queryKey: ['continuous_improvement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('continuous_improvement')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContinuousImprovement[];
    },
  });

  const createImprovement = useMutation({
    mutationFn: async (formData: ContinuousImprovementFormData) => {
      const { data, error } = await supabase
        .from('continuous_improvement')
        .insert({
          type: formData.type,
          theme: formData.theme || null,
          source: formData.source || null,
          problem: formData.problem || null,
          action: formData.action,
          status: formData.status,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuous_improvement'] });
      toast({
        title: "Action créée",
        description: "L'action d'amélioration a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'action: " + error.message,
      });
    },
  });

  const updateImprovement = useMutation({
    mutationFn: async ({ id, ...formData }: ContinuousImprovementFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('continuous_improvement')
        .update({
          type: formData.type,
          theme: formData.theme || null,
          source: formData.source || null,
          problem: formData.problem || null,
          action: formData.action,
          status: formData.status,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuous_improvement'] });
      toast({
        title: "Action mise à jour",
        description: "L'action d'amélioration a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour l'action: " + error.message,
      });
    },
  });

  const deleteImprovement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('continuous_improvement')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continuous_improvement'] });
      toast({
        title: "Action supprimée",
        description: "L'action d'amélioration a été supprimée.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'action: " + error.message,
      });
    },
  });

  return {
    improvements,
    isLoading,
    createImprovement,
    updateImprovement,
    deleteImprovement,
  };
}

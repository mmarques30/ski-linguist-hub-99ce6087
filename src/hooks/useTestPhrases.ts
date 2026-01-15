import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TestPhrase {
  id: string;
  language: string;
  category: string;
  profession: string | null;
  level_min: string | null;
  level_max: string | null;
  code: string | null;
  text_fr: string;
  is_positive: boolean;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TestPhraseFilters {
  language?: string;
  category?: string;
  profession?: string;
  isPositive?: boolean | null;
  active?: boolean | null;
  search?: string;
}

export function useTestPhrases(filters?: TestPhraseFilters) {
  return useQuery({
    queryKey: ["test-phrases", filters],
    queryFn: async () => {
      let query = supabase
        .from("test_phrases")
        .select("*")
        .order("category")
        .order("order_index");

      if (filters?.language && filters.language !== 'all') {
        query = query.or(`language.eq.${filters.language},language.eq.all`);
      }
      
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      
      if (filters?.profession) {
        query = query.or(`profession.is.null,profession.eq.${filters.profession}`);
      }
      
      if (filters?.isPositive !== null && filters?.isPositive !== undefined) {
        query = query.eq("is_positive", filters.isPositive);
      }
      
      if (filters?.active !== null && filters?.active !== undefined) {
        query = query.eq("active", filters.active);
      }
      
      if (filters?.search) {
        query = query.ilike("text_fr", `%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as TestPhrase[];
    },
  });
}

export function useTestPhrase(id: string) {
  return useQuery({
    queryKey: ["test-phrase", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_phrases")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as TestPhrase | null;
    },
    enabled: !!id,
  });
}

export function useCreateTestPhrase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (phrase: Omit<TestPhrase, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("test_phrases")
        .insert(phrase)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-phrases"] });
      toast({ title: "Phrase créée avec succès" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    },
  });
}

export function useUpdateTestPhrase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TestPhrase> & { id: string }) => {
      const { data, error } = await supabase
        .from("test_phrases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-phrases"] });
      toast({ title: "Phrase mise à jour" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    },
  });
}

export function useDeleteTestPhrase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("test_phrases")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-phrases"] });
      toast({ title: "Phrase supprimée" });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    },
  });
}

export function useBulkImportPhrases() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (phrases: Omit<TestPhrase, "id" | "created_at" | "updated_at">[]) => {
      const { data, error } = await supabase
        .from("test_phrases")
        .insert(phrases)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["test-phrases"] });
      toast({ title: `${data.length} phrases importées avec succès` });
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive", 
        title: "Erreur d'import", 
        description: error.message 
      });
    },
  });
}

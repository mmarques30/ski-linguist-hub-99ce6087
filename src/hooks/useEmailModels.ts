import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseEmailModelsOverview, type EmailModel } from "@/lib/email-models";

export interface EdgeDispatchLogRow {
  id: string;
  function_name: string;
  jobname: string | null;
  request_id: number | null;
  auth_mode: string;
  note: string | null;
  created_at: string;
}

export function useEmailModels() {
  return useQuery<EmailModel[]>({
    queryKey: ["email-models"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("email_models_overview");
      if (error) throw error;
      return parseEmailModelsOverview(data);
    },
  });
}

export function useEdgeDispatchLog(limit = 10) {
  return useQuery<EdgeDispatchLogRow[]>({
    queryKey: ["edge-dispatch-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edge_dispatch_log")
        .select("id, function_name, jobname, request_id, auth_mode, note, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidateModels() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["email-models"] });
    void queryClient.invalidateQueries({ queryKey: ["edge-dispatch-log"] });
  };
}

export function useSaveEmailDraft() {
  const invalidate = useInvalidateModels();
  return useMutation({
    mutationFn: async (draft: {
      slug: string;
      subject_fr: string;
      body_fr: string;
    }) => {
      const { slug, subject_fr, body_fr } = draft;
      // EN/PT conservés en colonnes vides : tous les envois partent en français.
      const { error } = await supabase
        .from("email_template_drafts")
        .update({
          subject_fr,
          body_fr,
          subject_en: "",
          body_en: "",
          subject_pt: "",
          body_pt: "",
        })
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function usePublishEmailDraft() {
  const invalidate = useInvalidateModels();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.rpc("publish_email_template_draft", { p_slug: slug });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUnpublishEmailTemplate() {
  const invalidate = useInvalidateModels();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.rpc("unpublish_email_template", { p_slug: slug });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useSetEmailCronActive() {
  const invalidate = useInvalidateModels();
  return useMutation({
    mutationFn: async ({ jobname, active }: { jobname: string; active: boolean }) => {
      const { error } = await supabase.rpc("set_email_cron_active", {
        p_jobname: jobname,
        p_active: active,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useRunEmailCronNow() {
  const invalidate = useInvalidateModels();
  return useMutation({
    mutationFn: async ({ jobname, dryRun }: { jobname: string; dryRun: boolean }) => {
      const { data, error } = await supabase.rpc("run_email_cron_now", {
        p_jobname: jobname,
        p_dry_run: dryRun,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENTS_BUCKET } from "@/lib/certificateStorage";
import {
  REGISTRATION_WELCOME_DOCUMENTS,
  acceptMimeForTemplate,
  isKnownRegistrationTemplate,
  registrationTemplateStoragePath,
  type RegistrationWelcomeDocument,
} from "@/lib/registration-welcome-documents";

export type RegistrationTemplateStatus = RegistrationWelcomeDocument & {
  hasOverride: boolean;
  updatedAt: string | null;
};

const QUERY_KEY = ["registration-document-templates"];

export function useRegistrationDocumentTemplates() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<RegistrationTemplateStatus[]> => {
      const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).list(
        "staff/registration-templates",
        { limit: 100 },
      );
      if (error && !error.message.toLowerCase().includes("not found")) {
        // Dossier absent = pas encore d'override : on continue avec la liste vide.
        if (!/not found|does not exist/i.test(error.message)) {
          throw error;
        }
      }

      const byName = new Map(
        (data ?? []).map((obj) => [obj.name, obj] as const),
      );

      return REGISTRATION_WELCOME_DOCUMENTS.map((doc) => {
        const obj = byName.get(doc.internalFile);
        return {
          ...doc,
          hasOverride: Boolean(obj),
          updatedAt: obj?.updated_at ?? obj?.created_at ?? null,
        };
      });
    },
  });
}

export function useDownloadRegistrationTemplate() {
  return useMutation({
    mutationFn: async (internalFile: string) => {
      if (!isKnownRegistrationTemplate(internalFile)) {
        throw new Error("Modèle inconnu");
      }
      const path = registrationTemplateStoragePath(internalFile);
      const { data: listed } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .list("staff/registration-templates", { search: internalFile, limit: 5 });
      const hasOverride = (listed ?? []).some((o) => o.name === internalFile);

      if (hasOverride) {
        const { data, error } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .createSignedUrl(path, 60 * 10);
        if (error || !data?.signedUrl) throw error ?? new Error("URL signée indisponible");
        return data.signedUrl;
      }

      return `/registration-documents/${internalFile}`;
    },
  });
}

export function useReplaceRegistrationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      internalFile,
      file,
    }: {
      internalFile: string;
      file: File;
    }) => {
      if (!isKnownRegistrationTemplate(internalFile)) {
        throw new Error("Modèle inconnu");
      }
      const expected = acceptMimeForTemplate(internalFile);
      const extOk = file.name.toLowerCase().endsWith(
        internalFile.slice(internalFile.lastIndexOf(".")).toLowerCase(),
      );
      if (!extOk) {
        throw new Error(
          `Extension incorrecte : attendez un fichier ${internalFile.slice(internalFile.lastIndexOf("."))}`,
        );
      }
      // Les navigateurs envoient souvent application/octet-stream pour .dotx
      if (
        expected === "application/pdf" &&
        file.type &&
        file.type !== "application/pdf" &&
        file.type !== "application/octet-stream"
      ) {
        throw new Error("Le fichier doit être un PDF");
      }
      if (file.size <= 0 || file.size > 20 * 1024 * 1024) {
        throw new Error("Fichier vide ou trop volumineux (max 20 Mo)");
      }

      const path = registrationTemplateStoragePath(internalFile);
      const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
        upsert: true,
        contentType: expected === "application/pdf" ? "application/pdf" : file.type || expected,
      });
      if (error) throw error;
      return path;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useClearRegistrationTemplateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (internalFile: string) => {
      if (!isKnownRegistrationTemplate(internalFile)) {
        throw new Error("Modèle inconnu");
      }
      const path = registrationTemplateStoragePath(internalFile);
      const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Point 8 complet — lecture des modèles d'emails.
 *
 * Un modèle n'est envoyable que s'il est présent ET actif dans
 * public.email_templates. Tant que Paula n'a pas validé le brouillon sur
 * /admin/emails, loadEmailTemplate renvoie null et l'appelant doit s'abstenir
 * d'envoyer : c'est ce qui garantit qu'aucun texte non relu ne part.
 *
 * Les colonnes EN/PT existent encore en base (héritage) mais ne sont plus
 * lues : tous les emails transactionnels partent en français.
 */

import { applyEmailTemplate } from "./fli-email.ts";

export interface EmailTemplateRow {
  slug: string;
  subject_fr: string;
  body_fr: string;
}

export interface RenderedEmail {
  slug: string;
  subject: string;
  html: string;
}

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => {
          maybeSingle: () => Promise<{ data: EmailTemplateRow | null }>;
        };
      };
    };
  };
};

export async function loadEmailTemplate(
  supabase: SupabaseLike,
  slug: string,
): Promise<EmailTemplateRow | null> {
  const { data } = await supabase
    .from("email_templates")
    .select("slug, subject_fr, body_fr")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}

export function renderEmailTemplate(
  template: EmailTemplateRow,
  variables: Record<string, string>,
): RenderedEmail {
  return {
    slug: template.slug,
    subject: applyEmailTemplate(template.subject_fr, variables),
    html: applyEmailTemplate(template.body_fr, variables),
  };
}

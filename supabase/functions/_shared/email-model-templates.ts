/**
 * Point 8 complet — lecture des modèles d'emails.
 *
 * Un modèle n'est envoyable que s'il est présent ET actif dans
 * public.email_templates. Tant que Paula n'a pas validé le brouillon sur
 * /admin/emails, loadEmailTemplate renvoie null et l'appelant doit s'abstenir
 * d'envoyer : c'est ce qui garantit qu'aucun texte non relu ne part.
 */

import { applyEmailTemplate } from "./fli-email.ts";

export interface EmailTemplateRow {
  slug: string;
  subject_fr: string;
  subject_en: string;
  subject_pt: string;
  body_fr: string;
  body_en: string;
  body_pt: string;
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
    .select("slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}

export type EmailLocale = "fr" | "en" | "pt";

export function renderEmailTemplate(
  template: EmailTemplateRow,
  variables: Record<string, string>,
  locale: EmailLocale = "fr",
): RenderedEmail {
  const subject = locale === "en"
    ? template.subject_en || template.subject_fr
    : locale === "pt"
      ? template.subject_pt || template.subject_fr
      : template.subject_fr;

  const body = locale === "en"
    ? template.body_en || template.body_fr
    : locale === "pt"
      ? template.body_pt || template.body_fr
      : template.body_fr;

  return {
    slug: template.slug,
    subject: applyEmailTemplate(subject, variables),
    html: applyEmailTemplate(body, variables),
  };
}

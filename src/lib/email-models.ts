/**
 * Point 8 complet — les six modèles d'emails.
 *
 * Source de vérité : la RPC `email_models_overview()`. Ce module ne fait que
 * typer sa réponse et fournir les contrôles affichés sur /admin/emails :
 * variables déclarées vs variables réellement présentes dans le texte, écart
 * entre le brouillon et le texte actif, et aperçu avec un jeu ZZTEST.
 */

export type EmailModelAudience = "candidat" | "client" | "interne";

export interface EmailModelVariant {
  slug: string;
  position: number;
  variant_label: string;
  subject_fr: string;
  subject_en: string;
  subject_pt: string;
  body_fr: string;
  body_en: string;
  body_pt: string;
  variables: string[];
  notes: string | null;
  draft_updated_at: string | null;
  is_active: boolean;
  validated_at: string | null;
  live_subject_fr: string | null;
  live_body_fr: string | null;
  in_sync: boolean;
}

export interface EmailModelCron {
  exists: boolean;
  active: boolean;
  schedule: string;
}

export interface EmailModel {
  model_key: string;
  position: number;
  title_fr: string;
  trigger_fr: string;
  audience: EmailModelAudience;
  edge_function: string | null;
  cron_jobname: string | null;
  cron: EmailModelCron | null;
  variants: EmailModelVariant[];
}

export type EmailModelStatus = "actif" | "partiel" | "brouillon";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function parseEmailModelsOverview(payload: unknown): EmailModel[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((raw) => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const cronRaw = row.cron as Record<string, unknown> | null | undefined;

      const variants = (Array.isArray(row.variants) ? row.variants : [])
        .map((variantRaw) => {
          const v = (variantRaw ?? {}) as Record<string, unknown>;
          return {
            slug: asString(v.slug),
            position: typeof v.position === "number" ? v.position : 1,
            variant_label: asString(v.variant_label),
            subject_fr: asString(v.subject_fr),
            subject_en: asString(v.subject_en),
            subject_pt: asString(v.subject_pt),
            body_fr: asString(v.body_fr),
            body_en: asString(v.body_en),
            body_pt: asString(v.body_pt),
            variables: asStringList(v.variables),
            notes: typeof v.notes === "string" ? v.notes : null,
            draft_updated_at: typeof v.draft_updated_at === "string" ? v.draft_updated_at : null,
            is_active: v.is_active === true,
            validated_at: typeof v.validated_at === "string" ? v.validated_at : null,
            live_subject_fr: typeof v.live_subject_fr === "string" ? v.live_subject_fr : null,
            live_body_fr: typeof v.live_body_fr === "string" ? v.live_body_fr : null,
            in_sync: v.in_sync === true,
          } satisfies EmailModelVariant;
        })
        .sort((a, b) => a.position - b.position || a.slug.localeCompare(b.slug));

      return {
        model_key: asString(row.model_key),
        position: typeof row.position === "number" ? row.position : 99,
        title_fr: asString(row.title_fr),
        trigger_fr: asString(row.trigger_fr),
        audience: (asString(row.audience, "interne") as EmailModelAudience),
        edge_function: typeof row.edge_function === "string" ? row.edge_function : null,
        cron_jobname: typeof row.cron_jobname === "string" ? row.cron_jobname : null,
        cron: cronRaw
          ? {
              exists: cronRaw.exists === true,
              active: cronRaw.active === true,
              schedule: asString(cronRaw.schedule),
            }
          : null,
        variants,
      } satisfies EmailModel;
    })
    .filter((model) => model.model_key !== "")
    .sort((a, b) => a.position - b.position);
}

/** Variables réellement présentes dans un texte, dans l'ordre d'apparition. */
export function variablesUsedIn(...texts: string[]): string[] {
  const found: string[] = [];
  for (const text of texts) {
    for (const match of (text || "").matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)) {
      const name = match[1];
      if (!found.includes(name)) found.push(name);
    }
  }
  return found;
}

export interface VariableCheck {
  /** Déclarées dans `variables` mais absentes du sujet et du corps. */
  unused: string[];
  /** Présentes dans le texte mais non déclarées : elles ne seront pas remplacées. */
  undeclared: string[];
}

export function checkVariables(variant: EmailModelVariant): VariableCheck {
  // Les envois sont exclusivement en français : on ignore EN/PT.
  const used = variablesUsedIn(variant.subject_fr, variant.body_fr);
  return {
    unused: variant.variables.filter((name) => !used.includes(name)),
    undeclared: used.filter((name) => !variant.variables.includes(name)),
  };
}

export function modelStatus(model: EmailModel): EmailModelStatus {
  const total = model.variants.length;
  if (total === 0) return "brouillon";
  const active = model.variants.filter((v) => v.is_active).length;
  if (active === 0) return "brouillon";
  if (active < total) return "partiel";
  return "actif";
}

/** Un modèle demande une relecture dès qu'un brouillon diffère du texte actif. */
export function needsReview(model: EmailModel): boolean {
  return model.variants.some((v) => !v.in_sync);
}

export function canPublish(variant: EmailModelVariant): boolean {
  return variant.subject_fr.trim() !== "" && variant.body_fr.trim() !== "";
}

/**
 * Jeu d'essai ZZTEST pour l'aperçu. Aucune donnée réelle, adresses non
 * délivrables conformément à la règle du dépôt.
 */
export const EMAIL_PREVIEW_SAMPLE: Record<string, string> = {
  student_name: "ZZTEST Camille",
  client_name: "ZZTEST ESF Val d'Isère",
  language: "Anglais",
  start_date: "12 janvier 2027",
  end_date: "16 janvier 2027",
  inscription_code: "INS-2027-0042",
  course_location: "Val d'Isère",
  modality_label: "Présentiel",
  slope_label: "Piste bleue",
  payment_label: "150 € carte bancaire en ligne + solde chèque à l'inscription",
  magic_link: "https://exemple.invalid/portail/lien-magique",
  invoice_number: "2026-0147",
  amount: "1 240,00 €",
  due_date: "1 septembre 2026",
  days_overdue: "14",
  survey_link: "https://exemple.invalid/survey/jeton",
  total_count: "3",
  dashboard_url: "https://exemple.invalid/inscriptions/schedule-validation",
  groups_html: "<p><em>(tableau des groupes par langue)</em></p>",
};

export function renderPreview(
  text: string,
  sample: Record<string, string> = EMAIL_PREVIEW_SAMPLE,
): string {
  return (text || "").replace(
    /\{\{\s*([a-z0-9_]+)\s*\}\}/gi,
    (whole, name: string) => sample[name] ?? whole,
  );
}

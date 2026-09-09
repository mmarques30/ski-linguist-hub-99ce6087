import { isRegistrationLanguageKey } from "@/lib/registration-languages";

const LANGUAGE_LABEL_TO_KEY: Record<string, string> = {
  Anglais: "english",
  Portugais: "portuguese",
  Russe: "russian",
  Néerlandais: "dutch",
  Allemand: "german",
  Espagnol: "spanish",
  Italien: "italian",
  Chinois: "chinese",
  Français: "french",
};

export function resolveRegistrationLanguageKey(language: string | null | undefined): string | null {
  if (!language) return null;
  if (isRegistrationLanguageKey(language)) return language;
  return LANGUAGE_LABEL_TO_KEY[language] ?? null;
}

export function buildPublicRegistrationUrl(origin: string, language?: string | null): string {
  const base = `${origin.replace(/\/$/, "")}/register`;
  const langKey = resolveRegistrationLanguageKey(language);
  return langKey ? `${base}?lang=${langKey}` : base;
}

export function buildSurveyUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/survey/${token}`;
}

export function buildStudentPortalPreviewUrl(origin: string, studentId: string): string {
  return `${origin.replace(/\/$/, "")}/students/${studentId}/portal-preview`;
}

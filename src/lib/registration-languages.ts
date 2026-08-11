/** Languages available in public registration + adaptive placement test. */
export const REGISTRATION_LANGUAGES = [
  { value: "english", label: "Anglais" },
  { value: "portuguese", label: "Portugais" },
  { value: "russian", label: "Russe" },
  { value: "dutch", label: "Néerlandais" },
  { value: "german", label: "Allemand" },
  { value: "spanish", label: "Espagnol" },
  { value: "italian", label: "Italien" },
  { value: "chinese", label: "Chinois" },
  { value: "french", label: "Français" },
] as const;

export type RegistrationLanguageKey = (typeof REGISTRATION_LANGUAGES)[number]["value"];

export function isRegistrationLanguageKey(value: string): value is RegistrationLanguageKey {
  return REGISTRATION_LANGUAGES.some((l) => l.value === value);
}

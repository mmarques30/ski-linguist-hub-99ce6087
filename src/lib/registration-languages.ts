/** Languages available in public registration + adaptive placement test.
 *  Délègue au catalogue unique (PLANO Onda D2).
 */
import { LANGUAGE_CATALOG, type LanguageCatalogKey } from "@/lib/language-catalog";

export const REGISTRATION_LANGUAGES = LANGUAGE_CATALOG.map((l) => ({
  value: l.key,
  label: l.label,
})) as ReadonlyArray<{ value: LanguageCatalogKey; label: string }>;

export type RegistrationLanguageKey = LanguageCatalogKey;

export function isRegistrationLanguageKey(value: string): value is RegistrationLanguageKey {
  return LANGUAGE_CATALOG.some((l) => l.key === value);
}

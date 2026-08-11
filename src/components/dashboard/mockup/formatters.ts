import { useLanguage } from "@/contexts/LanguageContext";

/** Locale-aware number, currency and date formatters, keyed off the app language. */
export function useFormatters() {
  const { language } = useLanguage();
  const locale = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";

  return {
    locale,
    currency: (value: number, compact = false) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 0,
      }).format(value),
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
    percent: (value: number, digits = 1) =>
      `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)}%`,
    date: (iso: string) =>
      new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(iso)),
  };
}

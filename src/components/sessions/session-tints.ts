import type { TileTone } from "@/components/ui-kit";

/**
 * Teinte de langue pour les blocs du planning.
 *
 * Les couleurs en dur de `LANG_BG` / `LANG_COLORS` (`bg-blue-100`…) ne
 * basculaient pas en thème sombre : on rend la même distinction langue par
 * langue avec les jetons de teinte du design system. Ce sont les teintes de
 * tuiles (pastel), pas la palette des séries de graphiques — un bloc de
 * planning n'est pas une série.
 */
const TONE_BY_LANGUAGE: Record<string, TileTone> = {
  Anglais: "blue",
  "Portugais brésilien": "teal",
  Russe: "rose",
  Néerlandais: "orange",
  Allemand: "gold",
  Italien: "purple",
  Espagnol: "navy",
  Chinois: "neutral",
  Français: "neutral",
};

/** Teinte associée à une langue ; `neutral` si la langue est inconnue. */
export function toneForLanguage(language: string | null | undefined): TileTone {
  if (!language) return "neutral";
  return TONE_BY_LANGUAGE[language] ?? "neutral";
}

/** Bloc plein (fond + texte + filet) — utilisé dans les cases du calendrier. */
export const LANGUAGE_BLOCK_CLASS: Record<TileTone, string> = {
  gold: "bg-[hsl(var(--tint-gold-bg))] border-[hsl(var(--tint-gold-ring))] text-[hsl(var(--tint-gold-fg))]",
  blue: "bg-[hsl(var(--tint-blue-bg))] border-[hsl(var(--tint-blue-ring))] text-[hsl(var(--tint-blue-fg))]",
  teal: "bg-[hsl(var(--tint-teal-bg))] border-[hsl(var(--tint-teal-ring))] text-[hsl(var(--tint-teal-fg))]",
  purple:
    "bg-[hsl(var(--tint-purple-bg))] border-[hsl(var(--tint-purple-ring))] text-[hsl(var(--tint-purple-fg))]",
  orange:
    "bg-[hsl(var(--tint-orange-bg))] border-[hsl(var(--tint-orange-ring))] text-[hsl(var(--tint-orange-fg))]",
  rose: "bg-[hsl(var(--tint-rose-bg))] border-[hsl(var(--tint-rose-ring))] text-[hsl(var(--tint-rose-fg))]",
  navy: "bg-[hsl(var(--tint-navy-bg))] border-[hsl(var(--tint-navy-ring))] text-[hsl(var(--tint-navy-fg))]",
  neutral:
    "bg-[hsl(var(--tint-neutral-bg))] border-[hsl(var(--tint-neutral-ring))] text-[hsl(var(--tint-neutral-fg))]",
};

/** Pastille pleine — la puce de langue de la fiche session. */
export const LANGUAGE_DOT_CLASS: Record<TileTone, string> = {
  gold: "bg-[hsl(var(--tint-gold-fg))]",
  blue: "bg-[hsl(var(--tint-blue-fg))]",
  teal: "bg-[hsl(var(--tint-teal-fg))]",
  purple: "bg-[hsl(var(--tint-purple-fg))]",
  orange: "bg-[hsl(var(--tint-orange-fg))]",
  rose: "bg-[hsl(var(--tint-rose-fg))]",
  navy: "bg-[hsl(var(--tint-navy-fg))]",
  neutral: "bg-[hsl(var(--tint-neutral-fg))]",
};

/** Teinte de pastille d'état pour les statuts de session. */
export const SESSION_STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "danger" | "purple"> = {
  planifiee: "info",
  en_cours: "success",
  terminee: "purple",
  annulee: "danger",
};

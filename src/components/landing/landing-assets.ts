/**
 * Catalogue des assets LP institutionnelle + choix recommandés pour validation.
 * Les PNGs `logo_fli_2026_*` ont un fond noir intégré ; les `fli-marca*` /
 * `fli-logo*` et personnages sont plutôt découpés (RGBA).
 */
import logoMarcaYellow from "@/assets/fli-marca-yellow.png";
import logoMarcaBlack from "@/assets/fli-marca-black.png";
import logoClassic from "@/assets/fli-logo.png";
import logoWhite from "@/assets/fli-logo-white.png";
import logo2026_1 from "@/assets/logo_fli_2026_1.png";
import logo2026_2 from "@/assets/logo_fli_2026_2.png";
import logo2026_3 from "@/assets/logo_fli_2026_3.png";
import logo2026_4 from "@/assets/logo_fli_2026_4.png";
import logo2026_5 from "@/assets/logo_fli_2026_5.png";
import logo2026_6 from "@/assets/logo_fli_2026_6.png";
import logo2026_7 from "@/assets/logo_fli_2026_7.png";
import logo2026_8 from "@/assets/logo_fli_2026_8.png";
import logo2026_9 from "@/assets/logo_fli_2026_9.png";
import logo2026_10 from "@/assets/logo_fli_2026_10.png";
import logo2026_16 from "@/assets/logo_fli_2026_16.png";
import logo2026_18 from "@/assets/logo_fli_2026_18.png";
import personagem01 from "@/assets/fli_personagem_01.png";
import personagem02 from "@/assets/fli_personagem_02p.png";
import personagem03 from "@/assets/fli_personagem_03.png";
import personagem04 from "@/assets/fli_personagem_04.png";
import authBg from "@/assets/fli-auth-bg.png";

export type LandingAsset = {
  id: string;
  src: string;
  label: string;
  usage: string;
  /** Fond noir dans le fichier → mieux sur surface claire ou avec matte. */
  hasBlackMatte?: boolean;
};

export const LOGO_CANDIDATES: LandingAsset[] = [
  {
    id: "marca-yellow",
    src: logoMarcaYellow,
    label: "fli-marca-yellow",
    usage: "Header / nav (déjà utilisé dans l’app)",
  },
  {
    id: "marca-black",
    src: logoMarcaBlack,
    label: "fli-marca-black",
    usage: "Sur fond jaune ou clair",
  },
  {
    id: "fli-logo",
    src: logoClassic,
    label: "fli-logo",
    usage: "Bloc jaune + texte (header clair)",
  },
  {
    id: "fli-logo-white",
    src: logoWhite,
    label: "fli-logo-white",
    usage: "Sur fond sombre",
  },
  {
    id: "2026-1",
    src: logo2026_1,
    label: "logo_fli_2026_1",
    usage: "Horizontal FLI + nom (orange)",
    hasBlackMatte: true,
  },
  {
    id: "2026-2",
    src: logo2026_2,
    label: "logo_fli_2026_2",
    usage: "Vertical icône + FLI",
    hasBlackMatte: true,
  },
  {
    id: "2026-3",
    src: logo2026_3,
    label: "logo_fli_2026_3",
    usage: "Horizontal compact FLI + nom",
    hasBlackMatte: true,
  },
  {
    id: "2026-4",
    src: logo2026_4,
    label: "logo_fli_2026_4",
    usage: "Nom complet empilé (orange)",
    hasBlackMatte: true,
  },
  {
    id: "2026-5",
    src: logo2026_5,
    label: "logo_fli_2026_5",
    usage: "Variante horizontale",
    hasBlackMatte: true,
  },
  {
    id: "2026-6",
    src: logo2026_6,
    label: "logo_fli_2026_6",
    usage: "Variante large",
    hasBlackMatte: true,
  },
  {
    id: "2026-7",
    src: logo2026_7,
    label: "logo_fli_2026_7",
    usage: "Vertical gris",
    hasBlackMatte: true,
  },
  {
    id: "2026-8",
    src: logo2026_8,
    label: "logo_fli_2026_8",
    usage: "Horizontal gris",
    hasBlackMatte: true,
  },
  {
    id: "2026-9",
    src: logo2026_9,
    label: "logo_fli_2026_9",
    usage: "Nom empilé gris",
    hasBlackMatte: true,
  },
  {
    id: "2026-10",
    src: logo2026_10,
    label: "logo_fli_2026_10",
    usage: "Variante 10",
    hasBlackMatte: true,
  },
  {
    id: "2026-16",
    src: logo2026_16,
    label: "logo_fli_2026_16",
    usage: "Picto globe+montagne (gris)",
    hasBlackMatte: true,
  },
  {
    id: "2026-18",
    src: logo2026_18,
    label: "logo_fli_2026_18",
    usage: "Picto globe+montagne (orange)",
    hasBlackMatte: true,
  },
];

export const CHARACTER_CANDIDATES: LandingAsset[] = [
  {
    id: "p01",
    src: personagem01,
    label: "fli_personagem_01",
    usage: "Hero — moniteur ski (identité montagne)",
  },
  {
    id: "p02",
    src: personagem02,
    label: "fli_personagem_02p",
    usage: "CTA plateforme — écran FLI / digital",
  },
  {
    id: "p03",
    src: personagem03,
    label: "fli_personagem_03",
    usage: "Section secondaire — ambiance détente",
  },
  {
    id: "p04",
    src: personagem04,
    label: "fli_personagem_04",
    usage: "Section formations / snowboard",
  },
];

/** Choix proposés pour la LP (à valider via /mockup/lp-assets). */
export const RECOMMENDED = {
  navLogo: logoMarcaYellow,
  heroLogo: logo2026_3,
  heroCharacter: personagem01,
  platformCharacter: personagem02,
  formationsCharacter: personagem04,
  atmosphereBg: authBg,
  markIcon: logo2026_18,
} as const;

export const YOUTUBE_VIDEO_ID = "1cIivE5ggCk";
export const YOUTUBE_TITLE = "Stage de portugais brésilien à Valmorel";

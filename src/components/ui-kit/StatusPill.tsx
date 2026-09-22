import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pastille d'état. Purement présentationnelle : le libellé reste calculé par
 * les helpers métier (`inscription-status`, `payment-methods`…), on ne fait
 * qu'habiller. La couleur n'est jamais seule porteuse de sens — le texte
 * reste lisible, et une icône peut être ajoutée.
 */

export type PillTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "purple";

const toneStyles: Record<PillTone, string> = {
  neutral: "bg-[hsl(var(--tint-neutral-bg))] text-[hsl(var(--tint-neutral-fg))] ring-[hsl(var(--tint-neutral-ring))]",
  info: "bg-[hsl(var(--tint-blue-bg))] text-[hsl(var(--tint-blue-fg))] ring-[hsl(var(--tint-blue-ring))]",
  success: "bg-[hsl(var(--tint-teal-bg))] text-[hsl(var(--tint-teal-fg))] ring-[hsl(var(--tint-teal-ring))]",
  warning: "bg-[hsl(var(--tint-gold-bg))] text-[hsl(var(--tint-gold-fg))] ring-[hsl(var(--tint-gold-ring))]",
  danger: "bg-[hsl(var(--tint-rose-bg))] text-[hsl(var(--tint-rose-fg))] ring-[hsl(var(--tint-rose-ring))]",
  accent: "bg-[hsl(var(--tint-orange-bg))] text-[hsl(var(--tint-orange-fg))] ring-[hsl(var(--tint-orange-ring))]",
  purple: "bg-[hsl(var(--tint-purple-bg))] text-[hsl(var(--tint-purple-fg))] ring-[hsl(var(--tint-purple-ring))]",
};

export function StatusPill({
  children,
  tone = "neutral",
  icon: Icon,
  dot = false,
  size = "md",
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  icon?: React.ComponentType<{ className?: string }>;
  /** Point coloré en tête — utile quand plusieurs pastilles se suivent. */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs",
        toneStyles[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden />}
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/**
 * Correspondance état métier → teinte. Centralisée pour que la même valeur
 * porte la même couleur partout (liste, fiche, tableau de bord).
 */
const TONE_BY_STATUS: Record<string, PillTone> = {
  // Inscriptions
  brouillon: "neutral",
  en_attente: "warning",
  confirmee: "info",
  en_cours: "success",
  terminee: "purple",
  facturee: "purple",
  annulee: "danger",
  // Factures
  draft: "neutral",
  sent: "info",
  en_attente: "warning",
  a_relancer: "accent",
  paid: "success",
  a_verifier: "warning",
  cancelled: "danger",
  // Paiements
  recu: "success",
  attendu: "warning",
  rejete: "danger",
  // Cycle de vie générique
  actif: "success",
  active: "success",
  inactif: "neutral",
  inactive: "neutral",
  candidat: "warning",
  prospect: "warning",
  valide: "success",
  refuse: "danger",
  envoye: "info",
  // Horaires J-10
  pending: "warning",
  approved: "success",
  // Évaluations
  complete: "success",
  completed: "success",
  evaluated: "success",
};

/** Teinte d'un code d'état ; `neutral` si l'état est inconnu. */
export function toneForStatus(status: string | null | undefined): PillTone {
  if (!status) return "neutral";
  return TONE_BY_STATUS[status] ?? "neutral";
}

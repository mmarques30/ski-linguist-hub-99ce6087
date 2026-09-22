import { LucideIcon } from "lucide-react";
import { StatTile } from "@/components/ui-kit";
import type { TileTone } from "@/components/ui-kit";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "info";
}

/**
 * Ancienne tuile de statistique — conservée pour les écrans qui l'utilisent
 * encore (`PartnersList`, `MoniteursSki`, `SatisfactionStats`).
 *
 * L'API publique ne bouge pas : elle délègue désormais à `StatTile` du kit,
 * pour que ces écrans héritent de la nouvelle apparence sans modification.
 * Les nouveaux écrans utilisent directement `StatTile`.
 */

const toneByVariant: Record<NonNullable<StatCardProps["variant"]>, TileTone> = {
  default: "neutral",
  warning: "gold",
  success: "teal",
  info: "blue",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <StatTile
      label={title}
      value={value}
      hint={subtitle}
      icon={icon}
      tone={toneByVariant[variant]}
      delta={
        trend
          ? {
              // L'ancienne API portait le signe dans `isPositive`.
              value: trend.isPositive ? Math.abs(trend.value) : -Math.abs(trend.value),
              label: "vs mois dernier",
            }
          : undefined
      }
    />
  );
}

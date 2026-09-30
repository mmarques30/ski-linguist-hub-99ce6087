import { Activity, GitBranch, KeyRound, ShieldAlert } from "lucide-react";
import { SubNav, type SubNavItem } from "@/components/ui-kit";

const TABS: SubNavItem[] = [
  {
    to: "/monitoramento",
    label: "Vue d'ensemble",
    icon: Activity,
    end: true,
  },
  {
    to: "/monitoramento/seguranca",
    label: "Sécurité",
    icon: ShieldAlert,
  },
  {
    to: "/monitoramento/qualidade",
    label: "Qualité",
    icon: GitBranch,
  },
  {
    to: "/monitoramento/acessos",
    label: "Accès",
    icon: KeyRound,
  },
];

export function MonitoramentoSubnav() {
  return <SubNav items={TABS} />;
}

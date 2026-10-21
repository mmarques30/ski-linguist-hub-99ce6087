import { ClipboardList, Layers } from "lucide-react";
import { SubNav, type SubNavItem } from "@/components/ui-kit";

const INSCRIPTIONS_TABS: SubNavItem[] = [
  {
    to: "/inscriptions",
    label: "Liste",
    icon: ClipboardList,
    end: true,
  },
  {
    to: "/inscriptions/par-formation",
    label: "Par formation",
    icon: Layers,
  },
];

/** Sous-navigation Inscriptions — Liste · Par formation. */
export function InscriptionsSubnav() {
  return <SubNav items={INSCRIPTIONS_TABS} />;
}

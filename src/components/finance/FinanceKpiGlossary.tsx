import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";
import { SurfaceCard } from "@/components/ui-kit";

const ENTRIES: { id: string; title: string; body: string }[] = [
  {
    id: "ca",
    title: "CA facturé",
    body: "Somme HT des factures du période (hors annulées). Source : table invoices.",
  },
  {
    id: "encaisse",
    title: "Encaissé",
    body: "Somme des paiements au statut « reçu » sur la période. Source : payments.",
  },
  {
    id: "depenses",
    title: "Dépenses",
    body: "Coûts de formation (formation_costs, HT) + charges fixes (fixed_costs) sur la période. Ce n’est plus le CA N−1.",
  },
  {
    id: "marge",
    title: "Marge brute",
    body: "CA facturé − coûts de formation (formation_costs). Les charges fixes sont suivies en Trésorerie / Charges.",
  },
  {
    id: "objectif",
    title: "Objectif CA (saison)",
    body: "Valeur seasons.revenue_target de la saison sélectionnée. Si vide : objectif non défini (plus de 50 000 € en dur).",
  },
  {
    id: "tresorerie",
    title: "Prévisionnel trésorerie",
    body: "Entrées = factures draft/sent dont l’échéance tombe dans le mois. Sorties = charges fixes non payées + formateurs à payer dont periode_fin tombe dans le mois (pas de double comptage).",
  },
];

/** Glossaire unique des KPI Pilotage (PLANO §9.8 / Onda D1). */
export function FinanceKpiGlossary() {
  return (
    <SurfaceCard
      title="Glossaire des indicateurs"
      description="Définition et source de chaque KPI du pilotage"
      icon={BookOpen}
    >
      <Accordion type="multiple" className="w-full">
        {ENTRIES.map((e) => (
          <AccordionItem key={e.id} value={e.id}>
            <AccordionTrigger className="text-sm">{e.title}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{e.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SurfaceCard>
  );
}

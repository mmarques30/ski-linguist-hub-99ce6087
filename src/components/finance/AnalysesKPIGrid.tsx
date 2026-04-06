import { FinanceKPICard } from "./FinanceKPICard";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Users, UserCheck, CalendarRange, Ticket, Target } from "lucide-react";
import { differenceInMonths } from "date-fns";

const i18n = {
  monthlyRevenue: { fr: 'CA Mensuel', 'pt-BR': 'Receita Mensal', en: 'Monthly Revenue' },
};

interface AnalysesKPIGridProps {
  caByType: Array<{ value: number; valueN1: number }> | undefined;
  caByClient: Array<{ total: number; count: number }> | undefined;
  kpis: {
    caFacture: number;
    nbFactures: number;
    encaisse: number;
    formateursConcernes: number;
    caFactureEvol: number | null;
    encaisseEvol: number | null;
  } | undefined;
  startDate: string;
  endDate: string;
}

export function AnalysesKPIGrid({ caByType, caByClient, kpis, startDate, endDate }: AnalysesKPIGridProps) {
  const caTotal = caByType?.reduce((s, i) => s + i.value, 0) || 0;
  const caTotalN1 = caByType?.reduce((s, i) => s + i.valueN1, 0) || 0;
  const nbClients = caByClient?.length || 1;
  const ticketMoyen = nbClients > 0 ? caTotal / nbClients : 0;
  const nbMois = Math.max(differenceInMonths(new Date(endDate), new Date(startDate)), 1);
  const caMensuelMoyen = caTotal / nbMois;
  const nbFormateurs = kpis?.formateursConcernes || 1;
  const caParFormateur = nbFormateurs > 0 ? caMensuelMoyen / nbFormateurs : 0;

  const nbFactures = kpis?.nbFactures || 0;
  const ticketMoyenFacture = nbFactures > 0 ? caTotal / nbFactures : 0;

  const evolCA = caTotalN1 > 0 ? ((caTotal - caTotalN1) / caTotalN1) * 100 : null;

  // Conversion rate: paid / total invoices
  const encaisse = kpis?.encaisse || 0;
  const tauxConversion = caTotal > 0 ? (encaisse / caTotal) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceKPICard
          title="CA par Activité"
          value={caTotal}
          variant="gold"
          formatAsPrice
          icon={BarChart3}
          evolution={evolCA ?? undefined}
          subtitle="Formations"
        />
        <FinanceKPICard
          title="CA par Client"
          value={ticketMoyen}
          variant="navy"
          formatAsPrice
          icon={Users}
          subtitle="ticket moyen"
        />
        <FinanceKPICard
          title="CA par Formateur"
          value={caParFormateur}
          variant="gold"
          formatAsPrice
          icon={UserCheck}
          subtitle="moyenne mensuelle"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <FinanceKPICard
          title="Receita Mensal"
          value={caMensuelMoyen}
          variant="navy"
          formatAsPrice
          icon={CalendarRange}
          evolution={kpis?.caFactureEvol ?? undefined}
          subtitle={`moy. sur ${nbMois} mois`}
        />
        <FinanceKPICard
          title="Ticket Moyen"
          value={ticketMoyenFacture}
          variant="gold"
          formatAsPrice
          icon={Ticket}
          subtitle="par facture"
        />
        <FinanceKPICard
          title="Taux de Conversion"
          value={`${tauxConversion.toFixed(1)}%`}
          variant="navy"
          icon={Target}
          subtitle="encaissé / facturé"
        />
      </div>
    </div>
  );
}

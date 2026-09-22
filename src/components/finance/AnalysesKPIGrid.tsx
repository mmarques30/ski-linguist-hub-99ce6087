import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, Users, UserCheck, CalendarRange, Ticket, Target } from "lucide-react";
import { differenceInMonths } from "date-fns";
import { StatTile, StatTileGrid } from "@/components/ui-kit";

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
  const { t } = useLanguage();
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

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-4">
      <StatTileGrid cols={3}>
        <StatTile
          label="CA par Activité"
          value={formatPrice(caTotal)}
          hint="Formations"
          icon={BarChart3}
          tone="gold"
          to="/invoices"
          delta={evolCA != null ? { value: evolCA, label: "vs N-1" } : undefined}
        />
        <StatTile
          label="CA par Client"
          value={formatPrice(ticketMoyen)}
          hint="ticket moyen"
          icon={Users}
          tone="navy"
        />
        <StatTile
          label="CA par Formateur"
          value={formatPrice(caParFormateur)}
          hint="moyenne mensuelle"
          icon={UserCheck}
          tone="teal"
        />
      </StatTileGrid>
      <StatTileGrid cols={3}>
        <StatTile
          label={t(i18n.monthlyRevenue)}
          value={formatPrice(caMensuelMoyen)}
          hint={`moy. sur ${nbMois} mois`}
          icon={CalendarRange}
          tone="navy"
          delta={
            kpis?.caFactureEvol != null
              ? { value: kpis.caFactureEvol, label: "vs N-1" }
              : undefined
          }
        />
        <StatTile
          label="Ticket Moyen"
          value={formatPrice(ticketMoyenFacture)}
          hint="par facture"
          icon={Ticket}
          tone="gold"
          to="/invoices"
        />
        <StatTile
          label="Taux de Conversion"
          value={`${tauxConversion.toFixed(1)}%`}
          hint="encaissé / facturé"
          icon={Target}
          tone="purple"
        />
      </StatTileGrid>
    </div>
  );
}

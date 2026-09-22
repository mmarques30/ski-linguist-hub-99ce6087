import { ClipboardList } from "lucide-react";
import {
  IdentityCell,
  StatusPill,
  SurfaceCard,
  TableEmpty,
  TableSkeleton,
  toneForStatus,
} from "@/components/ui-kit";
import { useRecentInscriptions } from "@/hooks/useInscriptions";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr, ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  title: {
    fr: "Inscriptions récentes",
    "pt-BR": "Inscrições recentes",
    en: "Recent Enrollments",
  },
  subtitle: {
    fr: "Dernières inscriptions de stagiaires",
    "pt-BR": "Últimas inscrições de estagiários",
    en: "Latest student enrollments",
  },
  noInscriptionsTitle: {
    fr: "Aucune inscription récente",
    "pt-BR": "Nenhuma inscrição recente",
    en: "No recent enrollments",
  },
  noInscriptionsDesc: {
    fr: "Les inscriptions apparaîtront ici",
    "pt-BR": "As inscrições aparecerão aqui",
    en: "Enrollments will appear here",
  },
  viewAll: {
    fr: "Voir toutes les inscriptions",
    "pt-BR": "Ver todas as inscrições",
    en: "View all enrollments",
  },
  statusInProgress: {
    fr: "En cours",
    "pt-BR": "Em andamento",
    en: "In Progress",
  },
  statusBilled: {
    fr: "Facturée",
    "pt-BR": "Faturada",
    en: "Billed",
  },
  statusCompleted: {
    fr: "Terminée",
    "pt-BR": "Concluída",
    en: "Completed",
  },
  statusCancelled: {
    fr: "Annulée",
    "pt-BR": "Cancelada",
    en: "Cancelled",
  },
};

export function RecentInscriptions() {
  const { data: recentInscriptions = [], isLoading } = useRecentInscriptions();
  const { language, t } = useLanguage();

  const getDateLocale = () => {
    switch (language) {
      case "pt-BR": return ptBR;
      case "en": return enUS;
      default: return fr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: getDateLocale() });
    } catch {
      return dateStr;
    }
  };

  const statusLabels: Record<string, string> = {
    brouillon: language === "pt-BR" ? "Rascunho" : language === "en" ? "Draft" : "Brouillon",
    en_attente: language === "pt-BR" ? "Pendente" : language === "en" ? "Pending" : "En attente",
    confirmee: language === "pt-BR" ? "Confirmada" : language === "en" ? "Confirmed" : "Confirmée",
    en_cours: t(translations.statusInProgress),
    terminee: t(translations.statusCompleted),
    facturee: t(translations.statusBilled),
    annulee: t(translations.statusCancelled),
  };

  return (
    <SurfaceCard
      title={t(translations.title)}
      description={t(translations.subtitle)}
      flush
      footer={
        <Link to="/inscriptions" className="text-sm font-medium text-primary hover:underline">
          {t(translations.viewAll)}
        </Link>
      }
    >
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : recentInscriptions.length === 0 ? (
        <TableEmpty
          icon={ClipboardList}
          title={t(translations.noInscriptionsTitle)}
          description={t(translations.noInscriptionsDesc)}
        />
      ) : (
        <ul className="divide-y divide-border">
          {recentInscriptions.map((inscription) => (
            <li key={inscription.id}>
              <Link
                to={`/inscriptions/${inscription.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--surface-sunken))]"
              >
                <IdentityCell
                  name={inscription.student_name || "N/A"}
                  secondary={inscription.student_email}
                />
                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium">{inscription.language}</p>
                    <p className="text-xs text-muted-foreground tabular">
                      {formatDate(inscription.start_date)}
                    </p>
                  </div>
                  <StatusPill tone={toneForStatus(inscription.status)} size="sm">
                    {statusLabels[inscription.status] || inscription.status}
                  </StatusPill>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SurfaceCard>
  );
}

import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentInscriptions } from "@/components/dashboard/RecentInscriptions";
import { UpcomingClasses } from "@/components/dashboard/UpcomingClasses";
import { Users, ClipboardList, GraduationCap, Euro } from "lucide-react";
import { useInscriptionStats } from "@/hooks/useInscriptions";
import { useStudentStats } from "@/hooks/useStudents";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  title: {
    fr: "Tableau de bord",
    "pt-BR": "Painel de controle",
    en: "Dashboard",
  },
  subtitle: {
    fr: "Vue d'ensemble de la gestion de votre école de langues",
    "pt-BR": "Visão geral da gestão da sua escola de idiomas",
    en: "Overview of your language school management",
  },
  totalStudents: {
    fr: "Total Stagiaires",
    "pt-BR": "Total de Estagiários",
    en: "Total Students",
  },
  registeredInSystem: {
    fr: "Inscrits dans le système",
    "pt-BR": "Registrados no sistema",
    en: "Registered in the system",
  },
  totalInscriptions: {
    fr: "Total Inscriptions",
    "pt-BR": "Total de Inscrições",
    en: "Total Enrollments",
  },
  inProgress: {
    fr: "en cours",
    "pt-BR": "em andamento",
    en: "in progress",
  },
  billed: {
    fr: "Facturées",
    "pt-BR": "Faturadas",
    en: "Billed",
  },
  billedInscriptions: {
    fr: "Inscriptions facturées",
    "pt-BR": "Inscrições faturadas",
    en: "Billed enrollments",
  },
  revenue: {
    fr: "Chiffre d'affaires",
    "pt-BR": "Faturamento",
    en: "Revenue",
  },
  totalAmount: {
    fr: "Montant total des inscriptions",
    "pt-BR": "Valor total das inscrições",
    en: "Total amount of enrollments",
  },
};

export default function Dashboard() {
  const { data: inscriptionStats } = useInscriptionStats();
  const { data: studentStats } = useStudentStats();
  const { language, t } = useLanguage();

  const formatCurrency = (value: number) => {
    const locale = language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : "fr-FR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
          <p className="text-muted-foreground">
            {t(translations.subtitle)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t(translations.totalStudents)}
            value={studentStats?.total || 0}
            subtitle={t(translations.registeredInSystem)}
            icon={Users}
          />
          <StatCard
            title={t(translations.totalInscriptions)}
            value={inscriptionStats?.total || 0}
            subtitle={`${inscriptionStats?.active || 0} ${t(translations.inProgress)}`}
            icon={ClipboardList}
            variant="warning"
          />
          <StatCard
            title={t(translations.billed)}
            value={inscriptionStats?.billed || 0}
            subtitle={t(translations.billedInscriptions)}
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title={t(translations.revenue)}
            value={formatCurrency(inscriptionStats?.totalRevenue || 0)}
            subtitle={t(translations.totalAmount)}
            icon={Euro}
            variant="info"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentInscriptions />
          <UpcomingClasses />
        </div>
      </div>
    </MainLayout>
  );
}

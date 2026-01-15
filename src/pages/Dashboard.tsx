import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentInscriptions } from "@/components/dashboard/RecentInscriptions";
import { UpcomingClasses } from "@/components/dashboard/UpcomingClasses";
import { Users, ClipboardList, GraduationCap, Euro } from "lucide-react";
import { useInscriptionStats } from "@/hooks/useInscriptions";
import { useStudentStats } from "@/hooks/useStudents";

export default function Dashboard() {
  const { data: inscriptionStats } = useInscriptionStats();
  const { data: studentStats } = useStudentStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
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
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de la gestion de votre école de langues
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Stagiaires"
            value={studentStats?.total || 0}
            subtitle="Inscrits dans le système"
            icon={Users}
          />
          <StatCard
            title="Total Inscriptions"
            value={inscriptionStats?.total || 0}
            subtitle={`${inscriptionStats?.active || 0} en cours`}
            icon={ClipboardList}
            variant="warning"
          />
          <StatCard
            title="Facturées"
            value={inscriptionStats?.billed || 0}
            subtitle="Inscriptions facturées"
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(inscriptionStats?.totalRevenue || 0)}
            subtitle="Montant total des inscriptions"
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

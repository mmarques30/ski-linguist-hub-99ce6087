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
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-muted-foreground">
            Visão geral da gestão da sua escola de idiomas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Alunos"
            value={studentStats?.total || 0}
            subtitle="Cadastrados no sistema"
            icon={Users}
          />
          <StatCard
            title="Total de Inscrições"
            value={inscriptionStats?.total || 0}
            subtitle={`${inscriptionStats?.active || 0} em curso`}
            icon={ClipboardList}
            variant="warning"
          />
          <StatCard
            title="Faturado"
            value={inscriptionStats?.billed || 0}
            subtitle="Inscrições faturadas"
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title="Receita Total"
            value={formatCurrency(inscriptionStats?.totalRevenue || 0)}
            subtitle="Valor total das inscrições"
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

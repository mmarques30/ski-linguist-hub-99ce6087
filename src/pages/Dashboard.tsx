import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentInscriptions } from "@/components/dashboard/RecentInscriptions";
import { UpcomingClasses } from "@/components/dashboard/UpcomingClasses";
import { Users, ClipboardList, GraduationCap, AlertCircle } from "lucide-react";

export default function Dashboard() {
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
            value={156}
            subtitle="Ativos nesta temporada"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Inscrições Pendentes"
            value={23}
            subtitle="Aguardando confirmação"
            icon={ClipboardList}
            variant="warning"
          />
          <StatCard
            title="Turmas Ativas"
            value={8}
            subtitle="Esta semana"
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title="Fechando em Breve"
            value={3}
            subtitle="Inscrições fecham em 10 dias"
            icon={AlertCircle}
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

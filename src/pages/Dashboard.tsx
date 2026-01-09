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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your language school management
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={156}
            subtitle="Active this season"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Pending Inscriptions"
            value={23}
            subtitle="Awaiting confirmation"
            icon={ClipboardList}
            variant="warning"
          />
          <StatCard
            title="Active Classes"
            value={8}
            subtitle="This week"
            icon={GraduationCap}
            variant="success"
          />
          <StatCard
            title="Closing Soon"
            value={3}
            subtitle="Inscriptions close in 10 days"
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

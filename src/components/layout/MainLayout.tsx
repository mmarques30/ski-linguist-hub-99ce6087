import { ReactNode } from "react";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TopHeader } from "./TopHeader";
import { Breadcrumbs } from "./Breadcrumbs";

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Coque du back-office : barre latérale repliable en rail d'icônes, en-tête
 * collant, fil d'Ariane, puis le contenu sur la surface de page teintée.
 *
 * Le contenu est plafonné à 1600px et centré : au-delà, les tableaux
 * s'étirent sans gagner en lisibilité.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[hsl(var(--surface-page))]">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[hsl(var(--surface-page))]">
          <TopHeader />
          <Breadcrumbs />
          <main className="flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

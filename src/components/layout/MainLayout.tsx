import { ReactNode } from "react";
import { AppSidebar, SidebarToggle } from "./Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
            <SidebarToggle />
          </header>
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

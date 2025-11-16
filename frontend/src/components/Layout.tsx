import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center px-6 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="mr-4 hover:bg-muted rounded-lg" />
            <div className="flex-1" />
          </header>

          {/* ⚠️ CORREGIDO – SIN overflow-x-auto */}
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

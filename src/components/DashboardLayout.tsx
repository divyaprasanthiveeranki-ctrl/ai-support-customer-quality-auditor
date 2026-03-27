import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CallProvider } from "@/contexts/CallContext";

export function DashboardLayout() {
  return (
    <CallProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-4 shrink-0">
              <SidebarTrigger className="mr-3" />
              <span className="text-sm font-medium text-muted-foreground">CallScribe Dashboard</span>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CallProvider>
  );
}

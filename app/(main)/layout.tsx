import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

import { HeaderBreadcrumb } from "@/components/header-breadcrumb";
import CvGuard from "@/components/cv-guard";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/logo";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-[#e4ebe4] dark:border-zinc-800 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <HeaderBreadcrumb />
          </div>
          <div className="flex items-center gap-3 px-4">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 overflow-y-auto">
          <CvGuard>{children}</CvGuard>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

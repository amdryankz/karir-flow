import { AppNavbar } from "@/components/app-navbar";
import CvGuard from "@/components/cv-guard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
      <AppNavbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">
          <CvGuard>{children}</CvGuard>
        </div>
      </main>
    </div>
  );
}

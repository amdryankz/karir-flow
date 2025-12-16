import type { Metadata } from "next";
import { AppNavbar } from "@/components/app-navbar";

export const metadata: Metadata = {
  title: "Upload CV",
};

export default function UploadCvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
      <AppNavbar />
      <main className="flex-1 grid place-items-center px-4">{children}</main>
    </div>
  );
}

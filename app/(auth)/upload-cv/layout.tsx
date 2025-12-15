import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Upload CV",
};

export default function UploadCvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell showAuth>{children}</PageShell>;
}

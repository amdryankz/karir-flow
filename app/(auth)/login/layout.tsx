import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell showAuth authCta={{ href: "/register", label: "Sign up" }} centerContent>
      {children}
    </PageShell>
  );
}

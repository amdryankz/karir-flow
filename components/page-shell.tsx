"use client";

import * as React from "react";
import { SiteHeader } from "@/components/site-header";

type AuthCta = { href: string; label: string };

type Props = {
  children: React.ReactNode;
  showAuth?: boolean;
  authCta?: AuthCta;
  withGradient?: boolean;
  centerContent?: boolean;
};

export function PageShell({
  children,
  showAuth = false,
  authCta,
  withGradient = true,
  centerContent = false,
}: Props) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {withGradient && (
        <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
      )}
      <SiteHeader showAuth={showAuth} authCta={authCta} />
      {centerContent ? (
        <main className="flex-1 grid place-items-center px-4">{children}</main>
      ) : (
        <main className="flex-1">{children}</main>
      )}
    </div>
  );
}

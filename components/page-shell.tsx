"use client";

import * as React from "react";
import { SiteHeader } from "@/components/site-header";

type Props = {
  children: React.ReactNode;
  showAuth?: boolean;
  withGradient?: boolean;
  centerContent?: boolean;
};

export function PageShell({
  children,
  showAuth = false,
  withGradient = true,
  centerContent = false,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-clip font-sans flex flex-col">
      {withGradient && (
        <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
      )}
      <SiteHeader showAuth={showAuth} />
      {centerContent ? (
        <main className="flex-1 grid place-items-center px-4">{children}</main>
      ) : (
        children
      )}
    </div>
  );
}

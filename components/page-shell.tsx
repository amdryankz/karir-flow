"use client";

import * as React from "react";
import { SiteHeader } from "@/components/site-header";

export function PageShell({
  children,
  showAuth = false,
  withGradient = true,
}: {
  children: React.ReactNode;
  showAuth?: boolean;
  withGradient?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-clip font-sans">
      {withGradient && (
        <div className="pointer-events-none absolute inset-0 -z-10 gradient-bg" />
      )}
      <SiteHeader showAuth={showAuth} />
      {children}
    </div>
  );
}

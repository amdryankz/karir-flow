"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function SiteHeader({ showAuth = false }: { showAuth?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
      <Logo />
      <div className="flex items-center gap-3">
        <ModeToggle />
        {showAuth && (
          <Button variant="outline" className="hidden sm:inline-flex">
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}

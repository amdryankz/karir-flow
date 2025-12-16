"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

type AuthCta = { href: string; label: string };

export function SiteHeader({
  showAuth = false,
  authCta,
}: {
  showAuth?: boolean;
  authCta?: AuthCta;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e4ebe4] dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-zinc-950/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between  pe-6 ps-2 lg:pe-8 lg:ps-4">
        <Logo />
        <div className="flex items-center gap-3">
          <ModeToggle />
          {showAuth && (
            <Button
              variant="outline"
              className="hidden sm:inline-flex rounded-lg"
              asChild
            >
              <Link href={authCta?.href ?? "/login"}>
                {authCta?.label ?? "Sign in"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

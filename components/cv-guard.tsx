"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCvStatus } from "@/hooks/use-cv-status";

export default function CvGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, hasCv } = useCvStatus();

  useEffect(() => {
    if (loading) return;
    if (hasCv === false) {
      router.replace("/upload-cv");
    }
  }, [loading, hasCv, router]);

  if (loading) {
    return (
      <div className="flex h-[calc(100svh-4rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span>Checking CV status…</span>
        </div>
      </div>
    );
  }

  // If hasCv is true, render protected content
  return <>{children}</>;
}

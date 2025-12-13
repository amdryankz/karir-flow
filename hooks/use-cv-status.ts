"use client";

import { useEffect, useState } from "react";

type CvStatus = {
  loading: boolean;
  hasCv: boolean | null;
  error: string | null;
};

export function useCvStatus(): CvStatus {
  const [state, setState] = useState<CvStatus>({ loading: true, hasCv: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch("/api/cv", { method: "GET" });
        if (!res.ok) {
          throw new Error("Failed to fetch CV status");
        }
        const json = await res.json();
        // If data exists, user has uploaded CV
        const hasCv = !!json?.data;
        if (!cancelled) setState({ loading: false, hasCv, error: null });
      } catch (err: any) {
        if (!cancelled) setState({ loading: false, hasCv: false, error: err?.message ?? "Unknown error" });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

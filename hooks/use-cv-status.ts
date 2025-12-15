"use client";

import { useEffect, useState } from "react";

type CvStatus = {
  loading: boolean;
  hasCv: boolean | null;
  error: string | null;
};

// In-memory cache to avoid rechecking on tab navigation within the app session.
let cvStatusCache: {
  checked: boolean;
  hasCv: boolean | null;
  promise?: Promise<boolean>;
} = {
  checked: false,
  hasCv: null,
};

// Reset cache (call on logout or when user changes)
export function resetCvStatusCache() {
  cvStatusCache = { checked: false, hasCv: null };
}

export function useCvStatus(): CvStatus {
  const [state, setState] = useState<CvStatus>(() =>
    cvStatusCache.checked
      ? { loading: false, hasCv: cvStatusCache.hasCv, error: null }
      : { loading: true, hasCv: null, error: null }
  );

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // If already checked, use cached result immediately
      if (cvStatusCache.checked) {
        if (!cancelled) {
          setState({ loading: false, hasCv: cvStatusCache.hasCv, error: null });
        }
        return;
      }

      // If a check is already in progress, wait for it
      if (cvStatusCache.promise) {
        try {
          const hasCv = await cvStatusCache.promise;
          if (!cancelled) {
            setState({ loading: false, hasCv, error: null });
          }
        } catch (err: any) {
          if (!cancelled) {
            setState({
              loading: false,
              hasCv: false,
              error: err?.message ?? "Unknown error",
            });
          }
        }
        return;
      }

      // Start a new check
      cvStatusCache.promise = (async () => {
        try {
          const res = await fetch("/api/cv", { method: "GET" });
          if (!res.ok) {
            throw new Error("Failed to fetch CV status");
          }
          const json = await res.json();
          const hasCv = !!json?.data;
          cvStatusCache = { checked: true, hasCv };
          return hasCv;
        } catch (err: any) {
          cvStatusCache = { checked: true, hasCv: false };
          throw err;
        }
      })();

      try {
        const hasCv = await cvStatusCache.promise;
        if (!cancelled) {
          setState({ loading: false, hasCv, error: null });
        }
      } catch (err: any) {
        if (!cancelled) {
          setState({
            loading: false,
            hasCv: false,
            error: err?.message ?? "Unknown error",
          });
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

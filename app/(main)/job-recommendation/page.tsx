"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import {
  ExternalLink,
  Loader2,
  MapPin,
  Building2,
  CalendarDays,
  Wifi,
  ArrowLeft,
} from "lucide-react";

type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt?: string; // ISO string or plain text
  isRemote?: boolean;
  jobUrl: string;
  applyUrl: string;
  skills?: string[];
  matchedSkillsCount?: number;
};

export default function JobRecommendationPage() {
  const { data } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | { code?: number; message: string }>(
    null
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
  const cacheKey = useMemo(() => {
    const uid = data?.user?.id || "anonymous";
    return `job-recommendation:${uid}`;
  }, [data?.user?.id]);

  // Cache helpers
  const isFresh = (ts: number) => Date.now() - ts < CACHE_TTL_MS;
  const getCache = (): { jobs: JobItem[]; ts: number } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  };
  const setCache = (items: JobItem[]) => {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ jobs: items, ts: Date.now() })
      );
    } catch (_) {
      // ignore quota errors
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchJobs() {
      try {
        setError(null);

        // 1) Try cache first (instant render)
        const cached = getCache();
        if (cached && isFresh(cached.ts)) {
          setJobs(cached.jobs);
          setLoading(false);
          return; // fresh cache → skip network
        }

        // 2) No fresh cache → fetch from API
        setLoading(true);
        const res = await fetch("/api/job-recommendation", {
          headers: {
            "x-user-id": data?.user?.id || "",
          },
        });
        if (!res.ok) {
          const msg = await safeMessage(res);
          if (!cancelled) setError({ code: res.status, message: msg });
          return;
        }
        const json = await res.json();
        const raw = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.jobs)
          ? json.jobs
          : Array.isArray(json)
          ? json
          : [];

        const items: JobItem[] = raw.map((j: any) => {
          const skillsRaw =
            j.skills ?? j.keywords ?? j.skillsText ?? j.skills_string ?? [];
          const matchedRaw =
            j.matchedSkills ?? j.skillMatches ?? j.matched ?? [];

          const toArray = (v: any): string[] => {
            if (!v) return [];
            if (Array.isArray(v))
              return v
                .map((x) => (typeof x === "string" ? x : x?.name ?? String(x)))
                .filter(Boolean);
            if (typeof v === "string")
              return v
                .split(/[,|]/)
                .map((s) => s.trim())
                .filter(Boolean);
            // object with keys
            if (typeof v === "object")
              return Object.values(v)
                .map((x: any) =>
                  typeof x === "string" ? x : x?.name ?? String(x)
                )
                .filter(Boolean);
            return [];
          };

          const skillsArr = toArray(skillsRaw);
          const matchedArr = toArray(matchedRaw);

          return {
            id:
              j.id ??
              j.jobId ??
              `${j.title ?? j.jobTitle}-${j.company ?? j.companyName}-${
                j.jobUrl ?? j.url ?? Math.random().toString(36).slice(2)
              }`,
            title: j.title ?? j.jobTitle ?? "Untitled Role",
            company: j.company ?? j.companyName ?? "Unknown Company",
            location: j.location ?? j.city ?? j.region ?? "",
            postedAt: j.postedAt ?? j.posted_date ?? j.date ?? undefined,
            isRemote: j.isRemote ?? j.remote ?? false,
            jobUrl: j.jobUrl ?? j.applyUrl ?? j.link ?? "#",
            skills: skillsArr,
            matchedSkillsCount:
              j.matchedSkillsCount ??
              j.matchCount ??
              (matchedArr.length > 0 ? matchedArr.length : undefined),
          } as JobItem;
        });
        if (!cancelled) {
          setJobs(items);
          // 3) Update cache for subsequent fast loads
          setCache(items);
        }
      } catch (e: any) {
        if (!cancelled)
          setError({ message: e?.message || "Failed to load jobs" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [data?.user?.id, cacheKey]);

  // Helper to show posted date nicely like "2 days ago"
  const formatPosted = (postedAt?: string) => {
    if (!postedAt) return undefined;
    const date = new Date(postedAt);
    if (isNaN(date.getTime())) return postedAt;
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              Job Recommendations
            </h1>
            <p className="text-[#5e6d55] dark:text-zinc-400">
              Analyzing your CV and finding roles tailored to you.
            </p>
          </div>

          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-[#14a800]" />
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  This may take 30–60 seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    const code = error.code;
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              Job Recommendations
            </h1>
            <p className="text-[#5e6d55] dark:text-zinc-400">
              Analyzing your CV and finding roles tailored to you.
            </p>
          </div>

          <Card className="border-none shadow-md rounded-2xl max-w-2xl">
            <CardContent className="p-8 space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error.message || "Something went wrong"}
              </p>
              {code === 401 && (
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  Please login to continue.
                </p>
              )}
              {(code === 400 || code === 404) && (
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  Please upload a valid CV to get tailored job recommendations.
                </p>
              )}
              {code === 500 && (
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  Server error. Please try again later.
                </p>
              )}
              <div className="flex gap-2">
                {code === 401 && (
                  <Button
                    onClick={() => (window.location.href = "/login")}
                    size="sm"
                    className="rounded-full bg-[#14a800] hover:bg-[#0f7d00] text-white"
                  >
                    Login
                  </Button>
                )}
                {(code === 400 || code === 404) && (
                  <Button
                    onClick={() => (window.location.href = "/upload-cv")}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#14a800] hover:text-white"
                  >
                    Upload CV
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
            Job Recommendations
          </h1>
          <p className="text-[#5e6d55] dark:text-zinc-400">
            Roles matched to your skills and preferences.
          </p>
        </div>

        {jobs.length === 0 ? (
          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                No jobs found for your profile yet. Try again later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} formatPosted={formatPosted} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function safeMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const json = JSON.parse(text);
    return json?.message || json?.error || res.statusText;
  } catch (_) {
    return res.statusText;
  }
}

function JobCard({
  job,
  formatPosted,
}: {
  job: JobItem;
  formatPosted: (postedAt?: string) => string | undefined;
}) {
  const postedText = formatPosted(job.postedAt);

  const onClick = () => {
    window.open(job.jobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl border-none shadow-md bg-white dark:bg-zinc-900 p-6 transition-all",
        "hover:shadow-lg hover:-translate-y-1"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-[#001e00] dark:text-zinc-100 leading-tight">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[#5e6d55] dark:text-zinc-400">
            <Building2 className="h-4 w-4" />
            <span>{job.company}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5e6d55] dark:text-zinc-400">
            <MapPin className="h-4 w-4" />
            <span>{job.location || "—"}</span>
            {job.isRemote && (
              <Badge
                variant="outline"
                className="ml-2 inline-flex items-center gap-1 border-[#14a800] text-[#14a800] bg-[#14a800]/5"
              >
                <Wifi className="h-3 w-3" /> Remote
              </Badge>
            )}
          </div>
          {postedText && (
            <div className="flex items-center gap-2 text-xs text-[#5e6d55] dark:text-zinc-400">
              <CalendarDays className="h-3 w-3" />
              <span>Posted {postedText}</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-xl bg-[#14a800]/10">
          <ExternalLink className="h-5 w-5 text-[#14a800]" />
        </div>
      </div>
    </div>
  );
}

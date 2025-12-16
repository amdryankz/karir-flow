"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  FileText,
  CheckCircle2,
  TriangleAlert,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

type OfferAnalysis = {
  id: string;
  offerLetterId: string;
  baseSalaryAmount?: string;
  bonusPolicy?: string;
  equityValue?: string;
  allowances?: string;
  totalCompensation?: string;
  jobTitle?: string;
  employmentType?: string;
  workingHours?: string;
  workLocation?: string;
  startDate?: string;
  probationTerms?: string;
  leavePolicy?: string;
  competitivenessScore?: number;
  clarityScore?: number;
  employerFavorability?: string;
  negotiationItems?: string;
  negotiationPhrases?: string;
  missingItems?: string;
  analyzedAt?: string;
};

type RedFlag = {
  id?: string;
  offerLetterId?: string;
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | string;
};

type OfferDetail = {
  id: string;
  userId: string;
  title: string; // Job Title / Company Name
  fileUrl: string;
  status: string; // uploaded | analyzed | failed
  createdAt: string;
  analysis?: OfferAnalysis | null;
  redFlags?: RedFlag[] | null;
};

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [detail, setDetail] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params?.id?.[0]
      : undefined;

  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/offering/${id}`, {
          headers: {
            "x-user-id": session?.user?.id || "",
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            json?.error || json?.message || "Failed to load offering detail"
          );
        }
        const data = json?.data ?? json; // support either nested or direct
        if (!cancelled) setDetail(data as OfferDetail);
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Failed to load offering detail");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [id, session?.user?.id]);

  const riskLevel = useMemo(() => {
    // Derive risk level from red flags severity counts
    const flags = detail?.redFlags || [];
    const high = flags.filter(
      (f) => (f.severity || "").toLowerCase() === "high"
    ).length;
    const medium = flags.filter(
      (f) => (f.severity || "").toLowerCase() === "medium"
    ).length;
    if (high > 0) return "High" as const;
    if (medium > 0) return "Medium" as const;
    return "Low" as const;
  }, [detail?.redFlags]);

  const riskColor =
    riskLevel === "High"
      ? "bg-red-500"
      : riskLevel === "Medium"
      ? "bg-yellow-500"
      : "bg-green-500";

  const goBack = () => router.push("/check-offering");
  const openPdf = () => {
    if (detail?.fileUrl)
      window.open(detail.fileUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Check Offering
          </Button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              Offer Detail
            </h1>
          </div>

          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-[#5e6d55] dark:text-zinc-400">
                <AlertCircle className="h-5 w-5 animate-pulse text-[#14a800]" />
                <span>Loading analysis…</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Check Offering
          </Button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              Offer Detail
            </h1>
          </div>

          <Card className="border-none shadow-md rounded-2xl bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <p className="text-red-700 dark:text-red-400 font-semibold">
                  Error loading detail
                </p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Check Offering
          </Button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              Offer Detail
            </h1>
          </div>

          <Card className="border-none shadow-md rounded-2xl">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                No analysis available for this offer letter.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const a = detail.analysis;
  const flags = detail.redFlags || [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Check Offering
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#001e00] dark:text-zinc-100">
              {detail.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#5e6d55] dark:text-zinc-400">
              <Badge
                variant="outline"
                className="capitalize border-[#e4ebe4] dark:border-zinc-700"
              >
                {detail.status}
              </Badge>
              {detail.createdAt && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {format(new Date(detail.createdAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={openPdf}
            className="rounded-full bg-[#14a800] hover:bg-[#0f7d00] text-white"
          >
            <FileText className="mr-2 h-4 w-4" /> View PDF
          </Button>
        </div>

        {/* Summary / Risk */}
        <Card className="border-none shadow-md rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-[#e4ebe4] dark:border-zinc-800 pb-6">
            <div>
              <CardTitle className="text-xl font-bold text-[#001e00] dark:text-zinc-100">
                Offer Letter Analysis Summary
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                AI-assisted evaluation of your offer terms
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-3 w-3 rounded-full ${riskColor}`}
              />
              <Badge
                variant="outline"
                className="border-[#e4ebe4] dark:border-zinc-700"
              >
                Risk: {riskLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-sm text-[#5e6d55] dark:text-zinc-400 leading-relaxed">
              {a?.negotiationPhrases ||
                a?.competitivenessScore ||
                a?.employerFavorability ||
                "This summary highlights potential risks, strengths, and negotiation points based on your offer letter."}
            </p>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#14a800]/10">
                  <Building2 className="h-5 w-5 text-[#14a800]" />
                </div>
                <CardTitle className="text-lg font-bold text-[#001e00] dark:text-zinc-100">
                  Company Legitimacy
                </CardTitle>
              </div>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Basic credibility indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Employment Type:
                </span>{" "}
                {a?.employmentType || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Work Location:
                </span>{" "}
                {a?.workLocation || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Start Date:
                </span>{" "}
                {a?.startDate || "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#14a800]/10">
                  <CheckCircle2 className="h-5 w-5 text-[#14a800]" />
                </div>
                <CardTitle className="text-lg font-bold text-[#001e00] dark:text-zinc-100">
                  Salary & Benefits
                </CardTitle>
              </div>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Compensation overview
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Base Salary:
                </span>{" "}
                {a?.baseSalaryAmount || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Allowances:
                </span>{" "}
                {a?.allowances || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Total Compensation:
                </span>{" "}
                {a?.totalCompensation || "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#14a800]/10">
                  <CheckCircle2 className="h-5 w-5 text-[#14a800]" />
                </div>
                <CardTitle className="text-lg font-bold text-[#001e00] dark:text-zinc-100">
                  Contract Clarity
                </CardTitle>
              </div>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Clarity & terms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Probation Terms:
                </span>{" "}
                {a?.probationTerms || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Leave Policy:
                </span>{" "}
                {a?.leavePolicy || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Clarity Score:
                </span>{" "}
                {a?.clarityScore ?? "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Red Flags */}
        <Card className="border-none shadow-md rounded-2xl bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="border-b border-red-200 dark:border-red-900/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <TriangleAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg font-bold text-red-900 dark:text-red-300">
                Red Flags
              </CardTitle>
            </div>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Potential risks detected in your offer
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {flags.length === 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  No red flags detected. Your offer looks good.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {flags.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${
                        (f.severity || "").toLowerCase() === "high"
                          ? "bg-red-500"
                          : (f.severity || "").toLowerCase() === "medium"
                          ? "bg-yellow-500"
                          : "bg-orange-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                        {f.type}
                      </p>
                      <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1">
                        {f.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Detailed Analysis (Collapsible) */}
        <div className="space-y-3">
          <details className="group rounded-2xl border-none shadow-md bg-white dark:bg-zinc-900 p-6">
            <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-[#001e00] dark:text-zinc-100">
              Salary Analysis
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 group-open:hidden">
                Show
              </span>
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 hidden group-open:inline">
                Hide
              </span>
            </summary>
            <div className="mt-4 pt-4 border-t border-[#e4ebe4] dark:border-zinc-800 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Base Salary:
                </span>{" "}
                {a?.baseSalaryAmount || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Bonus Policy:
                </span>{" "}
                {a?.bonusPolicy || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Equity:
                </span>{" "}
                {a?.equityValue || "—"}
              </p>
            </div>
          </details>

          <details className="group rounded-2xl border-none shadow-md bg-white dark:bg-zinc-900 p-6">
            <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-[#001e00] dark:text-zinc-100">
              Contract Terms
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 group-open:hidden">
                Show
              </span>
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 hidden group-open:inline">
                Hide
              </span>
            </summary>
            <div className="mt-4 pt-4 border-t border-[#e4ebe4] dark:border-zinc-800 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Working Hours:
                </span>{" "}
                {a?.workingHours || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Employment Type:
                </span>{" "}
                {a?.employmentType || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Probation Terms:
                </span>{" "}
                {a?.probationTerms || "—"}
              </p>
            </div>
          </details>

          <details className="group rounded-2xl border-none shadow-md bg-white dark:bg-zinc-900 p-6">
            <summary className="cursor-pointer list-none font-semibold flex items-center justify-between text-[#001e00] dark:text-zinc-100">
              Timeline
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 group-open:hidden">
                Show
              </span>
              <span className="text-sm text-[#5e6d55] dark:text-zinc-400 hidden group-open:inline">
                Hide
              </span>
            </summary>
            <div className="mt-4 pt-4 border-t border-[#e4ebe4] dark:border-zinc-800 text-sm text-[#5e6d55] dark:text-zinc-400 space-y-2">
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Start Date:
                </span>{" "}
                {a?.startDate || "—"}
              </p>
              <p>
                <span className="font-medium text-[#001e00] dark:text-zinc-100">
                  Analyzed At:
                </span>{" "}
                {a?.analyzedAt
                  ? format(new Date(a.analyzedAt), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

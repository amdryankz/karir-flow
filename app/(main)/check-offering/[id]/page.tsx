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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Offer Detail</h1>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <div className="flex h-[200px] items-center justify-center rounded-md border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5 animate-pulse" />
            <span>Loading analysis…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Offer Detail</h1>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-destructive font-medium mb-2">
              Error loading detail
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Offer Detail</h1>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No analysis available for this offer letter.
          </CardContent>
        </Card>
      </div>
    );
  }

  const a = detail.analysis;
  const flags = detail.redFlags || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{detail.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {detail.status}
            </Badge>
            {detail.createdAt && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />{" "}
                {format(new Date(detail.createdAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={openPdf}>
            <FileText className="mr-2 h-4 w-4" /> View PDF
          </Button>
        </div>
      </div>

      {/* Summary / Risk */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Offer Letter Analysis Summary</CardTitle>
            <CardDescription>
              AI-assisted evaluation of your offer terms
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-3 w-3 rounded-full ${riskColor}`} />
            <Badge variant="outline">Risk: {riskLevel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {a?.negotiationPhrases ||
              a?.competitivenessScore ||
              a?.employerFavorability ||
              "This summary highlights potential risks, strengths, and negotiation points based on your offer letter."}
          </p>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Company Legitimacy</CardTitle>
            </div>
            <CardDescription>Basic credibility indicators</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Employment Type: {a?.employmentType || "—"}</p>
            <p>Work Location: {a?.workLocation || "—"}</p>
            <p>Start Date: {a?.startDate || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Salary & Benefits</CardTitle>
            </div>
            <CardDescription>Compensation overview</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Base Salary: {a?.baseSalaryAmount || "—"}</p>
            <p>Allowances: {a?.allowances || "—"}</p>
            <p>Total Compensation: {a?.totalCompensation || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Contract Clarity</CardTitle>
            </div>
            <CardDescription>Clarity & terms</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>Probation Terms: {a?.probationTerms || "—"}</p>
            <p>Leave Policy: {a?.leavePolicy || "—"}</p>
            <p>Clarity Score: {a?.clarityScore ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Red Flags */}
      <Card className="border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-red-500" />
            <CardTitle>Red Flags</CardTitle>
          </div>
          <CardDescription>
            Potential risks detected in your offer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400">
              No red flags detected. Your offer looks good.
            </p>
          ) : (
            <ul className="space-y-2">
              {flags.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full ${
                      (f.severity || "").toLowerCase() === "high"
                        ? "bg-red-500"
                        : (f.severity || "").toLowerCase() === "medium"
                        ? "bg-yellow-500"
                        : "bg-orange-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{f.type}</p>
                    <p className="text-xs text-muted-foreground">
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
        <details className="group rounded-lg border bg-card p-4">
          <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
            Salary Analysis
            <span className="text-sm text-muted-foreground group-open:hidden">
              Show
            </span>
            <span className="text-sm text-muted-foreground hidden group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-3 text-sm text-muted-foreground space-y-1">
            <p>Base Salary: {a?.baseSalaryAmount || "—"}</p>
            <p>Bonus Policy: {a?.bonusPolicy || "—"}</p>
            <p>Equity: {a?.equityValue || "—"}</p>
          </div>
        </details>

        <details className="group rounded-lg border bg-card p-4">
          <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
            Contract Terms
            <span className="text-sm text-muted-foreground group-open:hidden">
              Show
            </span>
            <span className="text-sm text-muted-foreground hidden group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-3 text-sm text-muted-foreground space-y-1">
            <p>Working Hours: {a?.workingHours || "—"}</p>
            <p>Employment Type: {a?.employmentType || "—"}</p>
            <p>Probation Terms: {a?.probationTerms || "—"}</p>
          </div>
        </details>

        <details className="group rounded-lg border bg-card p-4">
          <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
            Timeline
            <span className="text-sm text-muted-foreground group-open:hidden">
              Show
            </span>
            <span className="text-sm text-muted-foreground hidden group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-3 text-sm text-muted-foreground space-y-1">
            <p>Start Date: {a?.startDate || "—"}</p>
            <p>
              Analyzed At:{" "}
              {a?.analyzedAt
                ? format(new Date(a.analyzedAt), "MMM d, yyyy")
                : "—"}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

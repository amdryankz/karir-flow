"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface CvDocument {
  id: string;
  fileName: string;
  pdfUrl: string;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { data } = useSession();

  const [loading, setLoading] = useState(true);
  const [cv, setCv] = useState<CvDocument | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch existing CV
  useEffect(() => {
    let cancelled = false;
    async function fetchCv() {
      try {
        setLoading(true);
        const res = await fetch("/api/cv");
        if (!res.ok) throw new Error("Failed to fetch CV");
        const json = await res.json();
        const doc = json?.data as CvDocument | null;
        if (!doc) throw new Error("CV not found");
        if (!cancelled) setCv(doc);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCv();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (uploadStatus === "uploading") return;
      setIsDragging(true);
    },
    [uploadStatus]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File must be under 10MB");
      return;
    }
    replaceCv(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (uploadStatus === "uploading") return;
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        validateAndUpload(droppedFiles[0]);
      }
    },
    [uploadStatus]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
      // reset input
      e.target.value = "";
    }
  };

  // Replace CV via PUT /api/cv with progress
  const replaceCv = (fileToUpload: File) => {
    setUploadStatus("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadStatus("success");
        setUploadProgress(100);
        try {
          const json = JSON.parse(xhr.responseText);
          const updated: CvDocument = {
            id: json.documentId,
            fileName: fileToUpload.name,
            pdfUrl: json.pdfUrl,
          };
          setCv(updated);
        } catch (_) {}
        toast.success("CV updated successfully");
      } else {
        setUploadStatus("error");
        try {
          const response = JSON.parse(xhr.responseText);
          toast.error(response.message || "Update failed");
        } catch (_) {
          toast.error("Update failed");
        }
      }
    });

    xhr.addEventListener("error", () => {
      setUploadStatus("error");
      toast.error("Network error occurred");
    });

    xhr.open("PUT", "/api/cv");
    xhr.send(formData);
  };

  // While loading: show skeletons instead of spinner to avoid repeated animations
  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="My Profile" description="View your details and update your CV." />
        <Card className="mt-6 w-full max-w-3xl">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-destructive">
          No CV found. Please upload a CV first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="My Profile"
        description="View your details and update your CV."
      />
      <Card className="mt-6 w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Account</CardTitle>
          <CardDescription>Your basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              User Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-md border p-3 bg-card">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{data?.user?.name ?? "-"}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              My CV
            </h2>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium truncate max-w-[280px]">
                    {cv.fileName}
                  </p>
                  <a
                    href={cv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View PDF
                  </a>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 transition-colors duration-200 ease-in-out flex flex-col items-center justify-center gap-3",
                uploadStatus === "uploading"
                  ? "border-primary bg-primary/5"
                  : isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Replace your CV</p>
              <p className="text-xs text-muted-foreground">
                PDF only (max. 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploadStatus === "uploading"}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={uploadStatus === "uploading"}
              >
                Select PDF
              </Button>
            </div>

            {uploadStatus !== "idle" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {uploadStatus === "uploading"
                      ? "Uploading…"
                      : uploadStatus === "success"
                      ? "Updated"
                      : "Error"}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 ease-out rounded-full",
                      uploadStatus === "success"
                        ? "bg-green-500"
                        : "bg-primary",
                      uploadStatus === "error" && "bg-destructive"
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  CV updated successfully
                </span>
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  CheckCircle,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
        } catch {}
        toast.success("CV updated successfully");
      } else {
        setUploadStatus("error");
        try {
          const response = JSON.parse(xhr.responseText);
          toast.error(response.message || "Update failed");
        } catch {
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
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-2xl">
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card className="border-none shadow-md rounded-2xl">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-6">
              <CardTitle className="text-2xl font-bold text-[#001e00] dark:text-zinc-100">
                My Profile
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Manage your account and CV information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="p-4 rounded-full bg-[#f9f9f9] dark:bg-zinc-800/50">
                  <FileText className="h-8 w-8 text-[#5e6d55] dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-[#001e00] dark:text-zinc-100">
                  No CV found
                </p>
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  Please upload a CV first to access your profile.
                </p>
                <Button
                  onClick={() => router.push("/upload-cv")}
                  className="mt-4 rounded-full bg-[#14a800] hover:bg-[#0f7d00] text-white"
                >
                  Upload CV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="border-none shadow-md rounded-2xl">
          <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-6">
            <CardTitle className="text-2xl font-bold text-[#001e00] dark:text-zinc-100">
              My Profile
            </CardTitle>
            <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
              Manage your account and CV information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#14a800]" />
                <h2 className="text-lg font-semibold text-[#001e00] dark:text-zinc-100">
                  User Information
                </h2>
              </div>
              <div className="rounded-2xl border border-[#e4ebe4] dark:border-zinc-800 p-6 bg-[#f9f9f9] dark:bg-zinc-800/50">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400">
                      Full Name
                    </Label>
                    <p className="mt-1 text-sm font-medium text-[#001e00] dark:text-zinc-100">
                      {data?.user?.name ?? "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400">
                      Email Address
                    </Label>
                    <p className="mt-1 text-sm font-medium text-[#001e00] dark:text-zinc-100">
                      {data?.user?.email ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#14a800]" />
                <h2 className="text-lg font-semibold text-[#001e00] dark:text-zinc-100">
                  My CV
                </h2>
              </div>

              <div className="flex items-center justify-between p-5 border border-[#e4ebe4] dark:border-zinc-800 rounded-xl bg-[#f9f9f9] dark:bg-zinc-800/50">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 rounded-xl bg-[#14a800]/10">
                    <FileText className="h-5 w-5 text-[#14a800]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[280px] text-[#001e00] dark:text-zinc-100">
                      {cv.fileName}
                    </p>
                    <a
                      href={cv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#14a800] hover:underline inline-flex items-center gap-1"
                    >
                      View PDF
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-3 cursor-pointer",
                  uploadStatus === "uploading"
                    ? "border-[#14a800] bg-[#14a800]/5"
                    : isDragging
                    ? "border-[#14a800] bg-[#14a800]/5"
                    : "border-[#e4ebe4] dark:border-zinc-700 hover:border-[#14a800]/50 hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-[#14a800]/10">
                  <Upload className="h-6 w-6 text-[#14a800]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[#001e00] dark:text-zinc-100">
                    Replace your CV
                  </p>
                  <p className="text-xs text-[#5e6d55] dark:text-zinc-400">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-[#5e6d55] dark:text-zinc-400">
                    PDF only (max. 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploadStatus === "uploading"}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadStatus === "uploading"}
                  className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#14a800] hover:text-white"
                >
                  {uploadStatus === "uploading" ? "Uploading..." : "Select PDF"}
                </Button>
              </div>

              {uploadStatus !== "idle" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#001e00] dark:text-zinc-100">
                      {uploadStatus === "uploading"
                        ? "Uploading…"
                        : uploadStatus === "success"
                        ? "Upload Complete"
                        : "Upload Failed"}
                    </span>
                    <span className="text-[#5e6d55] dark:text-zinc-400">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#e4ebe4] dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300 ease-out rounded-full",
                        uploadStatus === "success"
                          ? "bg-[#14a800]"
                          : uploadStatus === "error"
                          ? "bg-red-500"
                          : "bg-[#14a800]"
                      )}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-[#14a800]/10 border border-[#14a800]/20">
                  <CheckCircle className="h-5 w-5 text-[#14a800]" />
                  <span className="text-sm font-medium text-[#14a800]">
                    CV updated successfully
                  </span>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

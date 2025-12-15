"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

export default function UploadOfferingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  const pickFile = () => fileInputRef.current?.click();

  const reset = () => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
  };

  const validate = (f: File | null): f is File => {
    if (!f) return false;
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return false;
    }
    if (f.size > MAX_SIZE_BYTES) {
      toast.error("File must be under 10MB");
      return false;
    }
    return true;
  };

  const setAutoTitleIfEmpty = (f: File) => {
    if (!title.trim()) {
      const base = f.name.replace(/\.[^/.]+$/, "");
      setTitle(base);
    }
  };

  const upload = (f: File) => {
    if (!session?.user?.id) {
      toast.error("Please login to continue");
      return;
    }

    setStatus("uploading");
    setProgress(0);

    const form = new FormData();
    form.append("file", f);
    form.append("title", title.trim() || f.name.replace(/\.[^/.]+$/, ""));

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("success");
        setProgress(100);
        toast.success("Offer letter uploaded successfully");
      } else {
        setStatus("error");
        try {
          const res = JSON.parse(xhr.responseText);
          toast.error(res?.message || res?.error || "Upload failed");
        } catch (_) {
          toast.error("Upload failed");
        }
      }
    });

    xhr.addEventListener("error", () => {
      setStatus("error");
      toast.error("Network error during upload");
    });

    xhr.open("POST", "/api/offering");
    xhr.setRequestHeader("x-user-id", session.user.id);
    xhr.send(form);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!validate(f)) return;
    setFile(f);
    setAutoTitleIfEmpty(f);
    upload(f);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (status === "uploading" || status === "success") return;
      handleFiles(e.dataTransfer.files);
    },
    [status]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading" || status === "success") return;
      setIsDragging(true);
    },
    [status]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "uploading" || status === "success") return;
    handleFiles(e.target.files);
    // reset input to allow re-selecting same file
    e.currentTarget.value = "";
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Upload Offer Letter"
        description="Analyze your compensation and spot potential red flags."
      />
      <Card className="mt-6 w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Details</CardTitle>
          <CardDescription>Provide a title and upload a PDF</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Offer Title</label>
            <Input
              placeholder="e.g., PT. Contoh Sukses Sejahtera"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={status === "uploading"}
            />
            <p className="text-xs text-muted-foreground">
              This will be used to label your offer letter.
            </p>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 transition-colors duration-200 ease-in-out flex flex-col items-center justify-center gap-3 text-center",
              status === "uploading"
                ? "border-primary bg-primary/5"
                : isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => (status === "uploading" ? null : pickFile())}
          >
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Drag & drop your PDF here</p>
            <p className="text-xs text-muted-foreground">
              PDF only (max. 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onChangeInput}
              disabled={status === "uploading"}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={status === "uploading"}
            >
              Upload File
            </Button>
          </div>

          {file && (
            <div className="rounded-md border p-4 bg-card/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium truncate max-w-[280px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={status === "uploading"}
                  onClick={reset}
                >
                  {status === "uploading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {status === "uploading"
                      ? "Uploading…"
                      : status === "success"
                      ? "Uploaded"
                      : status === "error"
                      ? "Error"
                      : "Ready"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 ease-out rounded-full",
                      status === "success"
                        ? "bg-green-500"
                        : status === "error"
                        ? "bg-destructive"
                        : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {status === "error" && (
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" onClick={() => file && upload(file)}>
                    Retry Upload
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset}>
                    Choose Another File
                  </Button>
                </div>
              )}

              {status === "success" && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Offer letter uploaded successfully
                  </span>
                </div>
              )}
            </div>
          )}

          {status === "success" && (
            <div className="flex justify-end">
              <Button onClick={() => router.push("/check-offering")}>
                Back to Check Offering
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

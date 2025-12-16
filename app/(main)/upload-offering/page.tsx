"use client";

import { useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

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
        } catch {
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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (status === "uploading" || status === "success") return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === "uploading" || status === "success") return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "uploading" || status === "success") return;
    handleFiles(e.target.files);
    // reset input to allow re-selecting same file
    e.currentTarget.value = "";
  };

  return (
    <div className="min-h-full dark:bg-zinc-950 px-6 md:px-12 font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      <div className="mx-auto max-w-3xl">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="pl-0 hover:pl-2 transition-all text-[#5e6d55] hover:text-[#14a800] hover:bg-transparent dark:text-zinc-400 dark:hover:text-[#14a800]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Offers
          </Button>
        </div>

        <div>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden mt-4">
            <CardHeader className="bg-white dark:bg-zinc-900 border-b border-[#e4ebe4] dark:border-zinc-800 px-8 py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100 md:text-4xl">
                    Upload Offer Letter
                  </h1>
                  <p className="text-[#5e6d55] dark:text-zinc-400">
                    Analyze your compensation, benefits, and spot potential red
                    flags with AI-powered insights.
                  </p>
                </div>
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-xl font-medium text-[#001e00] dark:text-zinc-100">
                    <Sparkles className="h-5 w-5 text-[#14a800]" />
                    Offer Details
                  </CardTitle>
                  <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                    Provide a title and upload your PDF offer letter for
                    analysis.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-[#001e00] dark:text-zinc-200 font-medium"
                >
                  Offer Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Software Engineer at Tech Corp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={status === "uploading"}
                  className="h-12 rounded-xl border-[#e4ebe4] focus-visible:ring-[#14a800] focus-visible:border-[#14a800] bg-[#f9f9f9] dark:bg-zinc-800 dark:border-zinc-700"
                />
                <p className="text-xs text-[#5e6d55] dark:text-zinc-400">
                  This will be used to identify your offer letter.
                </p>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-2xl p-10 transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-4 text-center cursor-pointer",
                  status === "uploading"
                    ? "border-[#14a800] bg-[#14a800]/5 dark:bg-[#14a800]/10"
                    : isDragging
                    ? "border-[#14a800] bg-[#14a800]/5 dark:bg-[#14a800]/10 scale-[1.02]"
                    : "border-[#e4ebe4] dark:border-zinc-700 hover:border-[#14a800]/50 hover:bg-[#f9f9f9] dark:hover:bg-zinc-800/50"
                )}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => (status === "uploading" ? null : pickFile())}
              >
                <div
                  className={cn(
                    "p-4 rounded-full transition-colors",
                    status === "uploading" || isDragging
                      ? "bg-[#14a800]/10 dark:bg-[#14a800]/20"
                      : "bg-[#f9f9f9] dark:bg-zinc-800"
                  )}
                >
                  <Upload
                    className={cn(
                      "h-8 w-8 transition-colors",
                      status === "uploading" || isDragging
                        ? "text-[#14a800]"
                        : "text-[#5e6d55] dark:text-zinc-400"
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-[#001e00] dark:text-zinc-100">
                    {isDragging
                      ? "Drop your file here"
                      : "Drag & drop your PDF here"}
                  </p>
                  <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-[#5e6d55] dark:text-zinc-500">
                  PDF only • Maximum 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onChangeInput}
                  disabled={status === "uploading"}
                />
                {!file && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={status === "uploading"}
                    className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#14a800] hover:text-white dark:border-[#14a800] dark:text-[#14a800]"
                    onClick={(e) => {
                      e.stopPropagation();
                      pickFile();
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                )}
              </div>

              {file && (
                <div className="rounded-2xl border border-[#e4ebe4] dark:border-zinc-700 p-5 bg-[#f9f9f9] dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <div className="p-2.5 rounded-xl bg-[#14a800]/10 dark:bg-[#14a800]/20">
                        <FileText className="h-5 w-5 text-[#14a800]" />
                      </div>
                      <div className="grid gap-0.5 overflow-hidden">
                        <p className="text-sm font-medium truncate text-[#001e00] dark:text-zinc-100">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#5e6d55] dark:text-zinc-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 rounded-full"
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
                    <div className="flex justify-between text-xs">
                      <span
                        className={cn(
                          "font-medium",
                          status === "success"
                            ? "text-green-600 dark:text-green-400"
                            : status === "error"
                            ? "text-red-600 dark:text-red-400"
                            : "text-[#5e6d55] dark:text-zinc-400"
                        )}
                      >
                        {status === "uploading"
                          ? "Uploading…"
                          : status === "success"
                          ? "Uploaded Successfully"
                          : status === "error"
                          ? "Upload Failed"
                          : "Ready"}
                      </span>
                      <span className="text-[#5e6d55] dark:text-zinc-400 font-medium">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#e4ebe4] dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300 ease-out",
                          status === "success"
                            ? "bg-green-500"
                            : status === "error"
                            ? "bg-red-500"
                            : "bg-[#14a800]"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {status === "error" && (
                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => file && upload(file)}
                        className="rounded-full bg-[#14a800] hover:bg-[#108a00] text-white"
                      >
                        Retry Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={reset}
                        className="rounded-full hover:bg-[#f9f9f9] dark:hover:bg-zinc-700"
                      >
                        Choose Another File
                      </Button>
                    </div>
                  )}

                  {status === "success" && (
                    <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-xl">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Offer letter uploaded successfully
                      </span>
                    </div>
                  )}
                </div>
              )}

              {status === "success" && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => router.push("/check-offering")}
                    className="rounded-full bg-[#14a800] hover:bg-[#108a00] text-white shadow-sm"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    View All Offers
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

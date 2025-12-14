"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function UploadCvPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (status === "uploading" || status === "success") return;
      setIsDragging(true);
    },
    [status]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    // Max file size: 10MB
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (status === "uploading" || status === "success") return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        validateAndSetFile(droppedFiles[0]);
      }
    },
    [status]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const uploadFile = (fileToUpload: File) => {
    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("success");
        setProgress(100);
        toast.success("CV uploaded successfully!");
      } else {
        setStatus("error");
        try {
          const response = JSON.parse(xhr.responseText);
          toast.error(response.message || "Upload failed");
        } catch (e) {
          toast.error("Upload failed");
        }
      }
    });

    xhr.addEventListener("error", () => {
      setStatus("error");
      toast.error("Network error occurred");
    });

    xhr.open("POST", "/api/cv");
    // Assuming authentication is handled via cookies or similar mechanism that is automatically sent
    // If a token is needed in headers, it should be added here.
    // Based on previous context, better-auth is used, which likely uses cookies.

    xhr.send(formData);
  };

  const handleReset = () => {
    if (status === "uploading") return;
    setFile(null);
    setProgress(0);
    setStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Upload your CV
          </CardTitle>
          <CardDescription className="text-center">
            Upload your CV in PDF format to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-10 transition-colors duration-200 ease-in-out flex flex-col items-center justify-center gap-4 cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF only (max. 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="secondary" size="sm" className="mt-2">
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="grid gap-0.5">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={handleReset}
                  disabled={status === "uploading"}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {status === "uploading"
                      ? "Uploading..."
                      : status === "success"
                      ? "Completed"
                      : "Error"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 ease-out rounded-full",
                      status === "success" ? "bg-green-500" : "bg-primary",
                      status === "error" && "bg-destructive"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {status === "success" && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 text-green-500 justify-center">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Upload Successful!
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => router.push("/dashboard")}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-2 text-destructive justify-center">
                  <span className="text-sm font-medium">
                    Upload Failed. Please try again.
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

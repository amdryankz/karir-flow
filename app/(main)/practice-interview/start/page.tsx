"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Sparkles, Loader2, Globe, Hash } from "lucide-react";

function StartInterviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [language, setLanguage] = React.useState<"english" | "indonesian">(
    "english"
  );
  const [questionCount, setQuestionCount] = React.useState<number>(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isRepeat, setIsRepeat] = React.useState(false);
  const [repeatQuestionSetId, setRepeatQuestionSetId] = React.useState<
    string | null
  >(null);
  const [parentLanguage, setParentLanguage] = React.useState<
    "english" | "indonesian" | null
  >(null);
  const [parentQuestionCount, setParentQuestionCount] = React.useState<
    number | null
  >(null);

  const parentId = searchParams.get("parentId");
  const questionSetId = searchParams.get("questionSetId");
  const prefilledTitle = searchParams.get("title");

  React.useEffect(() => {
    if (!isPending && !session) {
      toast.error("Sesi Anda telah berakhir", {
        description: "Silakan login kembali untuk melanjutkan.",
      });
      router.push("/login");
    }
  }, [isPending, session, router]);

  // Check if this is repeat mode and fetch parent interview data
  React.useEffect(() => {
    const fetchParentInterview = async () => {
      if (parentId && questionSetId) {
        setIsRepeat(true);
        setRepeatQuestionSetId(questionSetId);
        if (prefilledTitle) {
          setTitle(decodeURIComponent(prefilledTitle));
        }

        // Fetch parent interview to get language and question count
        try {
          const userId = session?.user?.id;
          if (!userId) return;

          const response = await fetch(`/api/interview/${parentId}`, {
            headers: {
              "x-user-id": userId,
            },
          });

          if (response.ok) {
            const { data: parentInterview } = await response.json();
            const questionCount =
              parentInterview?.questionSet?.questions?.length || 5;
            setParentQuestionCount(questionCount);

            // Try to detect language from question set description
            // If description contains "(Bahasa Indonesia)", it's Indonesian
            const description = parentInterview?.questionSet?.description || "";
            if (description.includes("(Bahasa Indonesia)")) {
              setParentLanguage("indonesian");
            } else {
              setParentLanguage("english");
            }
          }
        } catch (err) {
          console.error("Failed to fetch parent interview:", err);
        }
      }
    };

    fetchParentInterview();
  }, [parentId, questionSetId, prefilledTitle, session?.user?.id]);

  const handleStart = () => {
    // Untuk repeat: langsung start tanpa perlu input apapun
    // Untuk new: harus ada title dan description
    if (!isRepeat && (!title.trim() || !description.trim())) {
      setError("Title and Job Description are required");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setError("You are not logged in. Please login first.");
      setShowConfirmDialog(false);
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": userId,
      };

      let finalQuestionSetId = repeatQuestionSetId;

      // Jika BUKAN repeat mode, generate questions baru
      if (!isRepeat) {
        const generateRes = await fetch("/api/interview", {
          method: "POST",
          headers,
          body: JSON.stringify({
            jobDesc: description,
            title: title.trim(),
            language,
            questionCount,
          }),
        });

        if (!generateRes.ok) {
          const body = await generateRes.json().catch(() => null);
          console.error("Generate error:", body);
          if (
            generateRes.status === 404 &&
            body?.message?.includes("CV document not found")
          ) {
            throw new Error(
              "Please upload your CV first. Visit your profile page to upload a CV before starting an interview."
            );
          }
          throw new Error(
            body?.message ||
              body?.error ||
              `Server Error (${generateRes.status}): Failed to generate interview questions.`
          );
        }

        const { data: interview } = await generateRes.json();
        finalQuestionSetId = interview.questionSet.id;

        const payload = {
          sessionId: interview.id,
          questionSetId: finalQuestionSetId,
          title: title.trim(),
          startedAt: Date.now(),
          questions: interview.questionSet.questions ?? [],
        };

        sessionStorage.setItem(
          "currentInterviewSession",
          JSON.stringify(payload)
        );
        setShowConfirmDialog(false);
        router.push("/practice-interview/session");
        return;
      }

      // For repeat mode, create interview session with existing questionSetId
      const interviewRes = await fetch("/api/interview", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          jobDesc: description || "Repeat interview",
          questionSetId: finalQuestionSetId,
          parentId: parentId || undefined,
          language: parentLanguage || "english",
          questionCount: parentQuestionCount || 5,
        }),
      });

      if (!interviewRes.ok) {
        const body = await interviewRes.json().catch(() => null);
        throw new Error(body?.message || "Failed to start interview session");
      }

      const { data: interview } = await interviewRes.json();

      const payload = {
        sessionId: interview.id,
        questionSetId: finalQuestionSetId,
        title: title.trim(),
        startedAt: Date.now(),
        questions: interview.questionSet.questions ?? [],
      };

      sessionStorage.setItem(
        "currentInterviewSession",
        JSON.stringify(payload)
      );
      setShowConfirmDialog(false);
      router.push("/practice-interview/session");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full dark:bg-zinc-950 px-6 md:px-12 font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="pl-0 hover:pl-2 transition-all text-[#5e6d55] hover:text-[#14a800] hover:bg-transparent dark:text-zinc-400 dark:hover:text-[#14a800]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>

        <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden mt-4">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-[#e4ebe4] dark:border-zinc-800 px-8 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100 md:text-4xl">
                  New Interview Session
                </h1>
                <p className="text-[#5e6d55] dark:text-zinc-400">
                  Configure your interview settings and provide context for the
                  AI interviewer.
                </p>
              </div>
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl font-medium text-[#001e00] dark:text-zinc-100">
                  <Sparkles className="h-5 w-5 text-[#14a800]" />
                  {isRepeat ? "Repeat Interview" : "Interview Context"}
                </CardTitle>
                <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                  {isRepeat
                    ? "You will answer the same questions again. Your previous answers won't be overwritten."
                    : "Provide a title and job description for the AI interviewer."}
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
                Interview Title *
              </Label>
              <Textarea
                id="title"
                placeholder="e.g. Frontend Developer at Google"
                className="min-h-[60px] resize-none text-base p-4 rounded-xl border-[#e4ebe4] focus-visible:ring-[#14a800] focus-visible:border-[#14a800] bg-[#f9f9f9] dark:bg-zinc-800 dark:border-zinc-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {!isRepeat && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-[#001e00] dark:text-zinc-200 font-medium"
                  >
                    Job Description / Context *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g. Senior Frontend Developer role at Tech Corp. Requirements: React, TypeScript, Node.js..."
                    className="min-h-[200px] resize-none text-base p-4 rounded-xl border-[#e4ebe4] focus-visible:ring-[#14a800] focus-visible:border-[#14a800] bg-[#f9f9f9] dark:bg-zinc-800 dark:border-zinc-700"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="language"
                      className="text-[#001e00] dark:text-zinc-200 font-medium flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4 text-[#14a800]" />
                      Interview Language
                    </Label>
                    <Select
                      value={language}
                      onValueChange={(value: "english" | "indonesian") =>
                        setLanguage(value)
                      }
                    >
                      <SelectTrigger
                        id="language"
                        className="h-12 rounded-xl border-[#e4ebe4] focus:ring-[#14a800] focus:border-[#14a800] bg-[#f9f9f9] dark:bg-zinc-800 dark:border-zinc-700"
                      >
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="english" className="rounded-lg">
                          English
                        </SelectItem>
                        <SelectItem value="indonesian" className="rounded-lg">
                          Bahasa Indonesia
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="questionCount"
                      className="text-[#001e00] dark:text-zinc-200 font-medium flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-[#14a800]" />
                      Number of Questions
                    </Label>
                    <Select
                      value={questionCount.toString()}
                      onValueChange={(value: string) =>
                        setQuestionCount(parseInt(value))
                      }
                    >
                      <SelectTrigger
                        id="questionCount"
                        className="h-12 rounded-xl border-[#e4ebe4] focus:ring-[#14a800] focus:border-[#14a800] bg-[#f9f9f9] dark:bg-zinc-800 dark:border-zinc-700"
                      >
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem
                            key={num}
                            value={num.toString()}
                            className="rounded-lg"
                          >
                            {num} Questions
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {isRepeat && (
              <div className="bg-[#f2f7f2] dark:bg-zinc-800/50 border border-[#e4ebe4] dark:border-zinc-700 rounded-xl p-6 space-y-3">
                <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                  You&apos;ll be answering the same set of questions from your
                  previous interview. You can change the title for this new
                  session.
                </p>
                {parentLanguage && parentQuestionCount && (
                  <div className="flex flex-wrap gap-4 pt-2 text-sm">
                    <div className="flex items-center gap-2 text-[#001e00] dark:text-zinc-200">
                      <Globe className="h-4 w-4 text-[#14a800]" />
                      <span className="font-medium">Language:</span>
                      <span className="capitalize">
                        {parentLanguage === "indonesian"
                          ? "Bahasa Indonesia"
                          : "English"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#001e00] dark:text-zinc-200">
                      <Hash className="h-4 w-4 text-[#14a800]" />
                      <span className="font-medium">Questions:</span>
                      <span>{parentQuestionCount}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <Button
              onClick={handleStart}
              disabled={
                isSubmitting ||
                (!isRepeat && (!title.trim() || !description.trim()))
              }
              className="w-full h-12 text-base rounded-full bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-sm hover:shadow-md transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isSubmitting
                ? "Processing..."
                : isRepeat
                ? "Start Repeat Interview"
                : "Start Interview"}
            </Button>
          </CardContent>
        </Card>

        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="rounded-2xl border-none shadow-xl bg-white dark:bg-zinc-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#001e00] dark:text-zinc-100">
                Are you ready for the interview?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#5e6d55] dark:text-zinc-400">
                The AI interviewer will start the session immediately. Make sure
                your microphone is ready.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full border-[#e4ebe4] text-[#5e6d55] hover:bg-[#f2f7f2] hover:text-[#001e00] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Not yet
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="rounded-full bg-[#14a800] text-white hover:bg-[#14a800]/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Starting..." : "I'm Ready"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function StartInterviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f2f7f2] dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-[#14a800]" />
        </div>
      }
    >
      <StartInterviewPageContent />
    </React.Suspense>
  );
}

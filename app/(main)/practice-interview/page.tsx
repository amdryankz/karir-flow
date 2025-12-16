"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/authClient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, RotateCcw, FileText, Sparkles, Calendar } from "lucide-react";
import Link from "next/link";

type InterviewSession = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt?: string | null;
  totalScore?: number | null;
  questionSet: {
    id: string;
    description: string;
    questions: Array<{
      id: string;
      text: string;
      order: number;
    }>;
  };
  answers: Array<{
    id: string;
    score: number;
    transcription: string;
    feedbackContent: string;
  }>;
};

export default function PracticeInterviewPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isPending && !session) {
      toast.error("Your session has expired", {
        description: "Please login again to continue.",
      });
      router.push("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchInterviews = async () => {
      try {
        const response = await fetch("/api/interview", {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session.user.id,
          },
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data sesi wawancara");
        }

        const { data } = await response.json();
        setInterviews(data || []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [session]);

  const getStatus = (interview: InterviewSession) => {
    const answers = interview.answers || [];
    const totalQuestions = interview.questionSet?.questions?.length || 0;

    // Belum mulai - 0 jawaban
    if (answers.length === 0) {
      return "Not Started";
    }
    
    if (totalQuestions === 0) return "Not Started";

    // Hitung average score dari answers (score backend dalam skala 1-10)
    const totalScore = answers.reduce(
      (sum, answer) => sum + (answer.score || 0),
      0
    );
    
    // Calculate average based on TOTAL questions
    const avgScore = totalScore / totalQuestions; // Scale 0-10

    // Status berdasarkan performance
    if (avgScore >= 8) return "Excellent";
    if (avgScore >= 6) return "Good";
    if (avgScore >= 4) return "Fair";
    return "Needs Work";
  };

  const getAverageScore = (interview: InterviewSession) => {
    // PATOKAN BACKEND: totalScore field (sudah dalam skala 0-100)
    if (interview.totalScore !== null && interview.totalScore !== undefined) {
      return interview.totalScore;
    }

    // Fallback: hitung dari answers jika totalScore belum diset
    const answers = interview.answers || [];
    const totalQuestions = interview.questionSet?.questions?.length || 0;
    
    if (totalQuestions === 0) return 0;
    
    const totalScore = answers.reduce(
      (sum, answer) => sum + (answer.score || 0),
      0
    );
    
    // Calculate average based on TOTAL questions
    // (totalScore / totalQuestions) * 10
    return Math.round((totalScore / totalQuestions) * 10);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isPending || loading) {
    return (
      <div className="min-h-full bg-background p-4 md:p-6 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>

          <Card className="border-none shadow-sm bg-card rounded-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/30 px-6 py-4">
              <Skeleton className="h-6 w-40 rounded-lg" />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-background p-4 md:p-6 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Practice Interview
              </h1>
              <p className="text-muted-foreground">
                Track your interview performance
              </p>
            </div>
            <Button asChild className="rounded-full shadow-sm">
              <Link href="/practice-interview/start">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Interview
              </Link>
            </Button>
          </div>
          <Card className="border-red-200/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30 shadow-sm rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-4">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                Failed to Load Interviews
              </h3>
              <p className="text-red-600 dark:text-red-400 max-w-md">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-6 rounded-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-full bg-background p-4 md:p-6 font-sans text-foreground transition-colors duration-300"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          variants={itemVariants}
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Practice Interview
            </h1>
            <p className="text-muted-foreground">
              {interviews.length === 0
                ? "Get started with AI-powered interview practice"
                : `Track and improve your interview performance`}
            </p>
          </div>
          <Button
            asChild
            className="h-10 rounded-full px-6 font-medium shadow-sm transition-all hover:shadow-md w-full sm:w-auto"
          >
            <Link href="/practice-interview/start">
              <Sparkles className="mr-2 h-4 w-4" />
              Start Interview
            </Link>
          </Button>
        </motion.div>

        {/* Interview History */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-sm bg-card rounded-xl">
            <CardHeader className="border-b bg-muted/30 px-6 py-5">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Interview History
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                View your past sessions and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {interviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-6">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to Start?
                  </h3>
                  <p className="mb-6 max-w-md text-muted-foreground leading-relaxed">
                    Begin your first practice interview session to receive
                    AI-powered feedback and improve your interview skills.
                  </p>
                  <Button asChild className="rounded-full shadow-sm">
                    <Link href="/practice-interview/start">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Your First Interview
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-[60px] px-6 py-4 font-semibold text-foreground">
                          #
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground min-w-[200px]">
                          Title
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Date
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Performance
                        </TableHead>
                        <TableHead className="py-4 font-semibold text-foreground">
                          Score
                        </TableHead>
                        <TableHead className="px-6 py-4 text-right font-semibold text-foreground min-w-[200px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((interview, index) => {
                        const status = getStatus(interview);
                        const avgScore = getAverageScore(interview);

                        return (
                          <TableRow
                            key={interview.id}
                            className="border-b hover:bg-muted/40 transition-colors"
                          >
                            <TableCell className="px-6 py-5 font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="py-5">
                              <div className="font-medium text-foreground line-clamp-2">
                                {interview.title}
                              </div>
                            </TableCell>
                            <TableCell className="py-5 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(interview.startedAt)}
                            </TableCell>
                            <TableCell className="py-5">
                              <Badge
                                variant="outline"
                                className={
                                  status === "Excellent"
                                    ? "bg-green-50 text-green-700 border-green-200 rounded-full px-3 py-1 font-medium dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
                                    : status === "Good"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 py-1 font-medium dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900"
                                    : status === "Fair"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full px-3 py-1 font-medium dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900"
                                    : status === "Needs Work"
                                    ? "bg-red-50 text-red-700 border-red-200 rounded-full px-3 py-1 font-medium dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
                                    : "bg-zinc-50 text-zinc-700 border-zinc-200 rounded-full px-3 py-1 font-medium dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                                }
                              >
                                {status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-5">
                              {avgScore !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-foreground">
                                    {avgScore}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    /100
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {interview.finishedAt ||
                                (interview.answers &&
                                  interview.answers.length > 0) ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="rounded-full hover:bg-muted"
                                    >
                                      <Link
                                        href={`/practice-interview/result?id=${interview.id}`}
                                      >
                                        <Eye className="h-4 w-4 mr-1.5" />
                                        <span className="hidden sm:inline">
                                          Results
                                        </span>
                                      </Link>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="rounded-full hover:bg-muted"
                                    >
                                      <Link
                                        href={`/practice-interview/start?parentId=${
                                          interview.id
                                        }&questionSetId=${
                                          interview.questionSet.id
                                        }&title=${encodeURIComponent(
                                          interview.title
                                        )}`}
                                      >
                                        <RotateCcw className="h-4 w-4 mr-1.5" />
                                        <span className="hidden sm:inline">
                                          Repeat
                                        </span>
                                      </Link>
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    asChild
                                    className="rounded-full"
                                  >
                                    <Link
                                      href={`/practice-interview/session?resume=${interview.id}`}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1.5" />
                                      Continue
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

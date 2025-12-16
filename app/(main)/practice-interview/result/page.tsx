"use client";

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
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, RotateCcw, Loader2, ArrowLeft, Play, Pause } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Suspense } from "react";

type Answer = {
  id: string;
  transcription: string;
  feedbackContent: string;
  feedbackTone: string;
  score: number;
  speechPace: string;
  confidentLevel: string;
  tips: string;
  questionId: string;
  audioUrl: string | null;
};

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full border-[#14a800] text-[#14a800] hover:bg-[#14a800] hover:text-white transition-colors"
        onClick={togglePlay}
        title={isPlaying ? "Pause recording" : "Play recording"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      <span className="text-xs text-[#5e6d55] dark:text-zinc-400 font-medium">
        {isPlaying ? "Playing..." : "Play Recording"}
      </span>
    </div>
  );
}

type Question = {
  id: string;
  text: string;
  order: number;
};

type InterviewData = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  totalScore: number | null;
  questionSet: {
    id: string;
    description: string;
    questions: Question[];
  };
  answers: Answer[];
};

function InterviewResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [interview, setInterview] = React.useState<InterviewData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isPending && !session) {
      toast.error("Sesi Anda telah berakhir", {
        description: "Silakan login kembali untuk melanjutkan.",
      });
      router.push("/login");
    }
  }, [isPending, session, router]);

  const [error, setError] = React.useState<string | null>(null);

  const interviewId = searchParams.get("id");

  React.useEffect(() => {
    if (!session?.user?.id || !interviewId) {
      setLoading(false);
      return;
    }

    const fetchInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`, {
          headers: {
            "x-user-id": session.user.id,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch interview data");
        }

        const { data } = await res.json();
        setInterview(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [session, interviewId]);

  const getScoreColor = (score: number) => {
    // Score in 1-10 scale from backend
    if (score >= 8) {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900";
    }
    if (score >= 6) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900";
    }
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900";
  };

  const calculateAverageScore = () => {
    if (!interview?.questionSet?.questions || interview.questionSet.questions.length === 0) return 0;
    
    const totalQuestions = interview.questionSet.questions.length;
    const totalScore = (interview.answers || []).reduce((sum, a) => sum + (a.score || 0), 0);
    
    // Calculate average based on TOTAL questions
    // Each answer is 1-10. Max total score is totalQuestions * 10.
    // We want 0-100 scale.
    // Formula: (totalScore / (totalQuestions * 10)) * 100 = (totalScore / totalQuestions) * 10
    
    return Math.round((totalScore / totalQuestions) * 10);
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) {
      return "In Progress";
    }
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return "text-[#14a800] dark:text-[#14a800]";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-500";
    return "text-red-600 dark:text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 md:p-12 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2 text-[#5e6d55] dark:text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#14a800]" />
                <p>Loading results...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen p-6 md:p-12 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">
                Results Not Available
              </CardTitle>
              <CardDescription className="text-red-600/80 dark:text-red-400/80">
                {error || "Interview data not found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="rounded-full bg-[#14a800] hover:bg-[#14a800]/90 text-white"
              >
                <Link href="/practice-interview">Back to List</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const avgScore = calculateAverageScore();
  const duration = formatDuration(interview.startedAt, interview.finishedAt);

  // Map answers to questions
  const questionsWithAnswers = interview.questionSet.questions.map((q) => {
    const answer = interview.answers.find((a) => a.questionId === q.id);
    return {
      question: q,
      answer,
    };
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/practice-interview")}
          className="group transition-all hover:pl-2 text-[#5e6d55] dark:text-zinc-400 hover:text-[#14a800] dark:hover:text-[#14a800]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Practice Interview
        </Button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#001e00] dark:text-zinc-100 md:text-4xl">
            Interview Results
          </h1>
          <p className="text-[#5e6d55] dark:text-zinc-400 text-lg">
            {interview.title}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#f9f9f9] dark:bg-zinc-800/50 border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <CardTitle className="text-[#001e00] mt-4 dark:text-zinc-100 font-medium">
                Overall Score
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Based on your answers accuracy and clarity
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-7xl font-bold tracking-tighter ${getTextColor(
                    avgScore
                  )}`}
                >
                  {avgScore}
                </span>
                <span className="text-2xl text-[#5e6d55] dark:text-zinc-400 font-medium">
                  / 100
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#f9f9f9] dark:bg-zinc-800/50 border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <CardTitle className="text-[#001e00] mt-4 dark:text-zinc-100 font-medium">
                Session Details
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Duration and stats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex justify-between items-center">
                <span className="text-[#5e6d55] dark:text-zinc-400 font-medium">
                  Duration
                </span>
                <span className="font-semibold text-[#001e00] dark:text-zinc-100 text-lg">
                  {duration}
                </span>
              </div>
              <Separator className="bg-[#e4ebe4] dark:bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6d55] dark:text-zinc-400 font-medium">
                  Questions Answered
                </span>
                <span className="font-semibold text-[#001e00] dark:text-zinc-100 text-lg">
                  {interview.answers.length} /{" "}
                  {interview.questionSet.questions.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-[#001e00] dark:text-zinc-100">
            Detailed Analysis
          </h2>
          <div className="grid gap-6">
            {questionsWithAnswers.map((item) => {
              const { question, answer } = item;

              return (
                <Card
                  key={question.id}
                  className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                >
                  <CardHeader className="pb-4 border-b border-[#e4ebe4] dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-[#14a800] uppercase tracking-wide">
                          Question {question.order}
                        </div>
                        <CardTitle className="text-lg font-medium text-[#001e00] dark:text-zinc-100 leading-relaxed">
                          {question.text}
                        </CardTitle>
                      </div>
                      {answer && (
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(
                            answer.score
                          )}`}
                        >
                          {answer.score}/10
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {answer ? (
                    <CardContent className="space-y-6 p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-[#5e6d55] dark:text-zinc-400 uppercase tracking-wide">
                            Your Answer
                          </div>
                          {answer.audioUrl && <AudioPlayer audioUrl={answer.audioUrl} />}
                        </div>
                        <p className="text-base text-[#001e00] dark:text-zinc-200 leading-relaxed bg-[#f9f9f9] dark:bg-zinc-800/50 p-4 rounded-xl border border-[#e4ebe4] dark:border-zinc-800">
                          {answer.transcription ||
                            "(No transcription available)"}
                        </p>
                      </div>
                      <div className="bg-[#f2f7f2] dark:bg-zinc-800/30 p-6 rounded-xl border border-[#e4ebe4] dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-base font-medium text-[#14a800]">
                          <CheckCircle2 className="h-5 w-5" />
                          AI Feedback
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400 uppercase tracking-wide">
                              Content Feedback
                            </div>
                            <p className="text-sm text-[#001e00] dark:text-zinc-300 leading-relaxed">
                              {answer.feedbackContent ||
                                "No feedback available"}
                            </p>
                          </div>
                          {answer.feedbackTone && (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400 uppercase tracking-wide">
                                Tone & Delivery
                              </div>
                              <p className="text-sm text-[#001e00] dark:text-zinc-300 leading-relaxed">
                                {answer.feedbackTone}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          {answer.speechPace && (
                            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-[#e4ebe4] dark:border-zinc-700 text-xs font-medium">
                              <span className="text-[#5e6d55] dark:text-zinc-400">
                                Pace:{" "}
                              </span>
                              <span className="text-[#001e00] dark:text-zinc-200">
                                {answer.speechPace}
                              </span>
                            </div>
                          )}
                          {answer.confidentLevel && (
                            <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-[#e4ebe4] dark:border-zinc-700 text-xs font-medium">
                              <span className="text-[#5e6d55] dark:text-zinc-400">
                                Confidence:{" "}
                              </span>
                              <span className="text-[#001e00] dark:text-zinc-200">
                                {answer.confidentLevel}
                              </span>
                            </div>
                          )}
                        </div>

                        {answer.tips && (
                          <div className="mt-4 pt-4 border-t border-[#d5e0d5] dark:border-zinc-700">
                            <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                              <strong className="text-[#001e00] dark:text-zinc-200">
                                💡 Tip:
                              </strong>{" "}
                              {answer.tips}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-6">
                      <p className="text-sm text-[#5e6d55] dark:text-zinc-400 italic">
                        Not answered yet
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 pb-12">
          <Button
            asChild
            className="h-12 px-6 rounded-full bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-sm hover:shadow-md transition-all"
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
              <RotateCcw className="mr-2 h-4 w-4" />
              Practice Again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#14a800]" />
        </div>
      }
    >
      <InterviewResultContent />
    </Suspense>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/authClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  MicOff,
  PhoneOff,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  EyeOff,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/components/voice-visualizer";

type QuestionItem = {
  id: string;
  text: string;
  order: number;
  voiceUrl?: string;
};

type StoredSession = {
  sessionId: string;
  questionSetId: string;
  title: string;
  jobDesc: string;
  startedAt: number;
  questions: QuestionItem[];
};

type AnswerSummary = {
  questionId: string;
  question: string;
  transcription: string;
  feedback: string;
  score: number;
  speechPace?: string;
  confidentLevel?: string;
  tips?: string;
  audioUrl?: string | null;
};

export default function InterviewSessionPage() {
  const router = useRouter();
  const { data: userSession, isPending } = useSession();
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const resumeId = searchParams.get("resume");
  const [session, setSession] = React.useState<StoredSession | null>(null);
  const [isQuestionVisible, setIsQuestionVisible] = React.useState(true);
  const [isCardMinimized, setIsCardMinimized] = React.useState(false);

  React.useEffect(() => {
    if (!isPending && !userSession) {
      toast.error("Sesi Anda telah berakhir", {
        description: "Silakan login kembali untuk melanjutkan.",
      });
      router.push("/login");
    }
  }, [isPending, userSession, router]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<AnswerSummary[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(5 * 60);
  const [error, setError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<BlobPart[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Audio Visualization Refs
  const [audioVolume, setAudioVolume] = React.useState(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Text-to-Speech function using ElevenLabs audio from voiceUrl
  const speakQuestion = async (voiceUrl?: string) => {
    if (!voiceUrl) return;

    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Cleanup previous audio context if any
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioVolume(0);

    setIsSpeaking(true);

    try {
      const audio = new Audio(voiceUrl);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;

      // Setup Audio Analysis for AI Voice
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Wait for audio to be ready to play
      audio.addEventListener("canplay", () => {
        try {
          const source = audioContext.createMediaElementSource(audio);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(audioContext.destination); // Connect to speakers
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (analyser && !audio.paused) {
              analyser.getByteFrequencyData(dataArray);
              const average =
                dataArray.reduce((a, b) => a + b) / dataArray.length;
              setAudioVolume(Math.min(1, average / 100));
              animationFrameRef.current = requestAnimationFrame(updateVolume);
            } else if (audio.paused) {
              setAudioVolume(0);
            }
          };
          updateVolume();
        } catch (e) {
          console.error("Error setting up audio visualization:", e);
          // Fallback: just play audio without visualization if CORS or other issue
        }
      });

      audio.onended = () => {
        setIsSpeaking(false);
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
        setAudioVolume(0);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        console.error("Audio playback error");
      };

      await audio.play();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsSpeaking(false);
    }
  };

  React.useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      if (resumeId) {
        try {
          if (!userSession?.user?.id) {
            return; // Wait for session to load
          }

          const response = await fetch(`/api/interview/${resumeId}`, {
            headers: {
              "x-user-id": userSession.user.id,
            },
          });
          if (response.ok) {
            const { data } = await response.json();
            const interview = data;
            if (interview) {
              const answerIndex = interview.answers?.length || 0;
              const payload: StoredSession = {
                sessionId: interview.id,
                questionSetId: interview.questionSet.id,
                title: interview.title,
                jobDesc: interview.questionSet.description,
                startedAt: Date.now(),
                questions: interview.questionSet.questions,
              };

              sessionStorage.setItem(
                "currentInterviewSession",
                JSON.stringify(payload)
              );
              setSession(payload);
              setCurrentQuestionIndex(answerIndex);

              const storedAnswers =
                interview.answers?.map((ans: any, idx: number) =>
                  normalizeAnswer(ans, interview.questionSet.questions[idx])
                ) || [];
              setAnswers(storedAnswers);
            }
          }
        } catch (err) {
          console.error("Failed to resume session:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        const stored = sessionStorage.getItem("currentInterviewSession");
        if (!stored) {
          router.push("/practice-interview/start");
          return;
        }

        try {
          const parsed: StoredSession = JSON.parse(stored);
          setSession(parsed);
          const elapsedSeconds = Math.floor(
            (Date.now() - parsed.startedAt) / 1000
          );
          const remaining = Math.max(0, 5 * 60 - elapsedSeconds);
          setTimeLeft(remaining);
        } catch (err) {
          console.error(err);
          router.push("/practice-interview/start");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSession();
  }, [router, resumeId, userSession?.user?.id]);

  // Auto-speak question when it changes
  React.useEffect(() => {
    if (session?.questions?.[currentQuestionIndex] && !isLoading) {
      const voiceUrl = session.questions[currentQuestionIndex].voiceUrl;
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        speakQuestion(voiceUrl);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, isLoading, session]);

  React.useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      if (isUploading) return; // Pause timer while uploading/processing answer

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Automatically finalize session when timer reaches 0
          if (session?.sessionId && !isUploading) {
            finalizeSession(session.sessionId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.sessionId, isUploading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Audio Analysis
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          // Normalize: average is 0-255. We want 0-1.
          // Speech usually isn't max volume, so we can boost it a bit.
          setAudioVolume(Math.min(1, average / 100));
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Cleanup Audio Context
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioVolume(0);

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        submitAnswer(audioBlob);

        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };
    }
  };

  const submitAnswer = async (audioBlob: Blob) => {
    if (!session || !userSession?.user?.id) return;

    setIsUploading(true);
    setError(null);

    const currentQ = session.questions[currentQuestionIndex];
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("questionId", currentQ.id);
    formData.append("interviewSessionId", session.sessionId);
    formData.append("questionText", currentQ.text);
    formData.append("jobDesc", session.jobDesc); // Send job desc for context

    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "x-user-id": userSession.user.id,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const { data } = await response.json();

      const newAnswer: AnswerSummary = {
        questionId: currentQ.id,
        question: currentQ.text,
        transcription: data.transcription,
        feedback: data.feedbackContent || data.feedback_content, // Handle backend vs frontend field names
        score: data.score,
        speechPace: data.speechPace || data.speech_pace, // Handle field name difference
        confidentLevel: data.confidentLevel || data.confidence_level, // Handle field name difference
        tips: data.tips,
        audioUrl: data.audioUrl,
      };

      // Update answers state
      setAnswers((prev) => [...prev, newAnswer]);

      // Determine next step
      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < session.questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        // Interview finished
        finalizeSession(session.sessionId);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process your answer. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const finalizeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/interview/${sessionId}/finish`, {
        method: "POST",
      });
      router.push(`/practice-interview/result?id=${sessionId}`);
    } catch (err) {
      console.error("Failed to finish session:", err);
    }
  };

  const handleEndSession = () => {
    if (
      confirm(
        "Are you sure you want to end the interview? Your progress will be saved."
      )
    ) {
      router.push("/practice-interview");
    }
  };

  const normalizeAnswer = (ans: any, question: QuestionItem): AnswerSummary => {
    return {
      questionId: question.id,
      question: question.text,
      transcription: ans.transcription,
      feedback: ans.feedbackContent || ans.feedback, // Handle different field names
      score: ans.score,
      audioUrl: ans.audioUrl,
    };
  };

  const currentQuestion = session?.questions?.[currentQuestionIndex];
  const progressLabel = session
    ? `${currentQuestionIndex + 1}/${session.questions.length}`
    : "-";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#f2f7f2] to-white dark:from-zinc-950 dark:to-zinc-900">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-[#14a800]/10 animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-[#14a800] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-[#001e00] dark:text-zinc-100">
              Preparing Interview
            </p>
            <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
              Setting up your session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background font-sans text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="w-full flex justify-between items-center max-w-6xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-foreground shadow-sm">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                timeLeft > 120
                  ? "bg-primary animate-pulse"
                  : timeLeft > 60
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500 animate-pulse"
              )}
            />
            <span>Time: {formatTime(timeLeft)}</span>
          </div>
          <span className="px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-sm">
            Question {progressLabel}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
          onClick={handleEndSession}
          title="End Interview"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 w-full max-w-6xl mx-auto p-6 pt-0 gap-8 pb-8",
          isCardMinimized
            ? "flex flex-col h-full"
            : "grid lg:grid-cols-2 items-start lg:items-stretch"
        )}
      >
        {/* Visualizer Area */}
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full relative min-h-[300px] bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-[#e4ebe4] dark:border-zinc-800 overflow-hidden order-2 lg:order-1 p-8 min-w-0",
            isCardMinimized ? "flex-1" : "lg:h-auto"
          )}
        >
          <div className="flex-1 flex items-center justify-center w-full pb-24">
            <div className="relative">
              <div
                className={cn(
                  "absolute inset-0 rounded-full blur-3xl transition-opacity duration-500",
                  isRecording ? "bg-primary/20 opacity-100" : "opacity-0"
                )}
              />
              <VoiceVisualizer
                active={isRecording || isUploading || isSpeaking}
                volume={isRecording || isSpeaking ? audioVolume : 0}
                className="scale-150 relative z-10 transition-colors duration-300 text-primary"
              />
            </div>
          </div>

          {/* Controls moved here */}
          <div className="w-full max-w-md flex items-center gap-4 mt-8 z-20">
            <Button
              className={cn(
                "flex-1 h-16 text-base font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95",
                "bg-linear-to-r from-[#14a800] to-[#0f7d00] hover:from-[#0f7d00] hover:to-[#0a5c00] text-white shadow-green-200 dark:shadow-green-900/50",
                isUploading && "opacity-75 cursor-not-allowed"
              )}
              onClick={handleRecordToggle}
              disabled={!session || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop & Send
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Start Answer
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-16 w-16 rounded-full border-2 border-[#e4ebe4] text-[#5e6d55] hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 shadow-md transition-all"
              onClick={handleEndSession}
              title="End Interview"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Minimized Card Trigger */}
          {isCardMinimized && (
            <div
              className="absolute top-6 right-6 z-10 cursor-pointer animate-in fade-in zoom-in duration-300"
              onClick={() => setIsCardMinimized(false)}
            >
              <div className="bg-white dark:bg-zinc-900 border-2 border-[#14a800]/30 dark:border-[#14a800]/40 shadow-2xl rounded-2xl p-4 flex items-center gap-3 hover:scale-105 hover:border-[#14a800] transition-all">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#14a800]/20 to-[#14a800]/10 dark:from-[#14a800]/30 dark:to-[#14a800]/20 flex items-center justify-center text-[#14a800]">
                  <Maximize2 className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400 uppercase">
                    Current Question
                  </span>
                  <span className="text-sm font-semibold text-[#001e00] dark:text-zinc-100 max-w-[150px] truncate">
                    {currentQuestion?.text}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question & Controls Card */}
        {!isCardMinimized && (
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-lg rounded-3xl flex flex-col order-1 lg:order-2 h-auto lg:h-full min-w-0 overflow-hidden">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-6 bg-linear-to-br from-[#f9f9f9] to-white dark:from-zinc-900 dark:to-zinc-900/50">
              <CardTitle className="flex items-center justify-between gap-3 text-xl font-bold text-[#001e00] dark:text-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-linear-to-br from-[#14a800] to-[#0f7d00] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {currentQuestionIndex + 1}
                  </div>
                  <span className="truncate">
                    {session?.title || "AI Interview"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#14a800]/10 rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-[#14a800]/20 transition-colors"
                  onClick={() => setIsCardMinimized(true)}
                  title="Minimize card"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-sm text-[#5e6d55] dark:text-zinc-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14a800] animate-pulse" />
                Answer with your voice, AI will provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 pb-6 flex-1 flex flex-col">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-[#5e6d55] dark:text-zinc-500 font-bold flex items-center gap-2">
                    <div className="h-1 w-8 rounded-full bg-[#14a800]" />
                    Current Question
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 gap-2 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#14a800]/10 rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-[#14a800]/20 transition-colors text-xs font-medium"
                      onClick={() => setIsQuestionVisible(!isQuestionVisible)}
                      title={isQuestionVisible ? "Hide text" : "Show text"}
                    >
                      {isQuestionVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {isQuestionVisible ? "Hide" : "Show"}
                    </Button>
                    {isSpeaking && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14a800]/10 text-xs text-[#14a800] font-semibold">
                        <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                        Speaking...
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#14a800]/10 rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-[#14a800]/20 transition-colors disabled:opacity-40"
                      onClick={() =>
                        currentQuestion &&
                        speakQuestion(currentQuestion.voiceUrl)
                      }
                      disabled={
                        isSpeaking ||
                        !currentQuestion ||
                        !currentQuestion.voiceUrl
                      }
                      title="Repeat question"
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {isQuestionVisible ? (
                  <div className="bg-linear-to-br from-[#f9f9f9] to-white dark:from-zinc-800 dark:to-zinc-800/50 rounded-2xl p-6 border border-[#e4ebe4] dark:border-zinc-700">
                    <p className="text-xl font-semibold text-[#001e00] dark:text-zinc-100 leading-relaxed">
                      {currentQuestion?.text || "Question not found"}
                    </p>
                  </div>
                ) : (
                  <div className="h-28 flex items-center justify-center text-[#5e6d55] dark:text-zinc-500 italic bg-linear-to-br from-[#f9f9f9] to-white dark:from-zinc-800 dark:to-zinc-800/50 rounded-2xl border border-dashed border-[#e4ebe4] dark:border-zinc-700">
                    Question hidden. Listen to the audio.
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-linear-to-r from-[#14a800]/10 to-[#0f7d00]/10 border border-[#14a800]/20 text-sm font-medium text-[#14a800] dark:text-[#14a800]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing your answer with AI...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-linear-to-br from-red-50 to-red-50/50 p-4 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 shadow-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {answers.length > 0 && (
                <div className="space-y-4 overflow-hidden flex flex-col max-h-[220px]">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-linear-to-r from-[#14a800]/10 to-[#0f7d00]/10 border border-[#14a800]/20 text-sm font-semibold text-[#14a800] dark:text-[#14a800] w-fit">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {answers.length} Answer{answers.length > 1 ? "s" : ""}{" "}
                      Submitted
                    </span>
                  </div>
                  <div className="overflow-y-auto space-y-2.5 pr-2 flex-1 scrollbar-thin scrollbar-thumb-[#e4ebe4] dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {answers.map((ans) => (
                      <div
                        key={ans.questionId}
                        className="rounded-2xl border border-[#e4ebe4] bg-linear-to-br from-[#f9f9f9] to-white dark:from-zinc-800 dark:to-zinc-800/50 p-4 text-sm space-y-2 dark:border-zinc-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#001e00] dark:text-zinc-300 truncate max-w-[65%]">
                            {ans.question}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold border-2 rounded-full px-2.5 py-0.5",
                              (ans.score || 0) >= 8
                                ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                                : (ans.score || 0) >= 6
                                ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                                : "bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
                            )}
                          >
                            {ans.score ?? 0}/10
                          </Badge>
                        </div>
                        <p className="text-[#5e6d55] dark:text-zinc-400 line-clamp-2 text-xs leading-relaxed">
                          {ans.feedback || ans.transcription}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

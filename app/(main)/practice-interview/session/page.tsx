"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/authClient"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mic, MicOff, PhoneOff, X, Loader2, CheckCircle2, AlertCircle, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceVisualizer } from "@/components/voice-visualizer"

type QuestionItem = {
  id: string
  text: string
  order: number
}

type StoredSession = {
  sessionId: string
  questionSetId: string
  title: string
  jobDesc: string
  startedAt: number
  questions: QuestionItem[]
}

type AnswerSummary = {
  questionId: string
  question: string
  transcription: string
  feedback: string
  score: number
  speechPace?: string
  confidentLevel?: string
  tips?: string
  audioUrl?: string | null
}

export default function InterviewSessionPage() {
  const router = useRouter()
  const { data: userSession } = useSession()
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  )
  const resumeId = searchParams.get("resume")
  const [session, setSession] = React.useState<StoredSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<AnswerSummary[]>([])
  const [isRecording, setIsRecording] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState(5 * 60)
  const [error, setError] = React.useState<string | null>(null)

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const mediaStreamRef = React.useRef<MediaStream | null>(null)
  const audioChunksRef = React.useRef<BlobPart[]>([])
  const synthRef = React.useRef<SpeechSynthesis | null>(null)
  const [isSpeaking, setIsSpeaking] = React.useState(false)

  // Initialize TTS
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        synthRef.current?.getVoices()
      }
      
      loadVoices()
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices
      }
    }
  }, [])

  // Text-to-Speech function
  const speakQuestion = async (text: string) => {
    if (!synthRef.current || !text) return

    // Stop any ongoing speech
    synthRef.current.cancel()
    setIsSpeaking(true)

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice properties for clear English
    utterance.rate = 0.85 // Slower for clarity
    utterance.pitch = 1.0 // Normal pitch
    utterance.volume = 1.0 // Full volume
    utterance.lang = 'en-US' // Force English US

    // Select the best English voice available
    const voices = synthRef.current.getVoices()
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en-') && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang.startsWith('en-US')
    ) || voices.find(voice => 
      voice.lang.startsWith('en')
    )
    
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    // Event handlers
    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      console.error('Speech synthesis error')
    }

    // Start speaking
    synthRef.current.speak(utterance)
  }

  React.useEffect(() => {
    const loadSession = async () => {
      if (resumeId) {
        try {
          if (!userSession?.user?.id) {
            return // Wait for session to load
          }
          
          const response = await fetch(`/api/interview/${resumeId}`, {
            headers: {
              "x-user-id": userSession.user.id,
            },
          })
          if (response.ok) {
            const { data } = await response.json()
            const interview = data
            if (interview) {
              const answerIndex = interview.answers?.length || 0
              const payload: StoredSession = {
                sessionId: interview.id,
                questionSetId: interview.questionSet.id,
                title: interview.title,
                jobDesc: interview.questionSet.description,
                startedAt: Date.now(),
                questions: interview.questionSet.questions,
              }
              
              sessionStorage.setItem("currentInterviewSession", JSON.stringify(payload))
              setSession(payload)
              setCurrentQuestionIndex(answerIndex)
              
              const storedAnswers = interview.answers?.map((ans: any, idx: number) => 
                normalizeAnswer(ans, interview.questionSet.questions[idx])
              ) || []
              setAnswers(storedAnswers)
              return
            }
          }
        } catch (err) {
          console.error("Failed to resume session:", err)
        }
      }

      const stored = sessionStorage.getItem("currentInterviewSession")
      if (!stored) {
        router.push("/practice-interview/start")
        return
      }

      try {
        const parsed: StoredSession = JSON.parse(stored)
        setSession(parsed)
        const elapsedSeconds = Math.floor((Date.now() - parsed.startedAt) / 1000)
        const remaining = Math.max(0, 5 * 60 - elapsedSeconds)
        setTimeLeft(remaining)
      } catch (err) {
        console.error(err)
        router.push("/practice-interview/start")
      }
    }

    loadSession()
  }, [router, resumeId, userSession?.user?.id])

  React.useEffect(() => {
    if (!session) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          finalizeSession(answers)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, answers])

  // Auto-speak question when it changes
  React.useEffect(() => {
    if (!currentQuestion || !session) return
    
    // Speak the question after a short delay
    const timer = setTimeout(() => {
      speakQuestion(currentQuestion.text)
    }, 1000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, session])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDurationMs = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const normalizeAnswer = (data: any, question: QuestionItem): AnswerSummary => ({
    questionId: data?.questionId ?? question.id,
    question: question.text,
    transcription: data?.transcription ?? "",
    feedback: data?.feedbackContent ?? data?.feedback_content ?? "",
    score: typeof data?.score === "number" ? data.score : 0,
    speechPace: data?.speechPace ?? data?.speech_pace,
    confidentLevel: data?.confidentLevel ?? data?.confidence_level,
    tips: data?.tips ?? "",
    audioUrl: data?.audioUrl ?? null,
  })

  const finalizeSession = (finalAnswers: AnswerSummary[]) => {
    if (!session) return
    // Navigate to result page with interview ID from URL or session
    router.push(`/practice-interview/result?id=${session.sessionId}`)
  }

  const prepareMedia = async () => {
    if (mediaStreamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
    } catch (err) {
      console.error(err)
      throw new Error("Gagal mengakses mikrofon")
    }
  }

  const startRecording = async () => {
    if (!session) return
    setError(null)
    await prepareMedia()

    if (!mediaStreamRef.current) {
      setError("Stream mikrofon tidak tersedia")
      return
    }

    audioChunksRef.current = []
    
    // Detect supported MIME type
    let mimeType = "audio/webm"
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus"
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm"
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4"
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg"
      }
    }
    
    const recorder = new MediaRecorder(mediaStreamRef.current, {
      mimeType,
    })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    recorder.onstop = () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm"
      const blob = new Blob(audioChunksRef.current, { type: mimeType })
      submitAnswer(blob)
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  const submitAnswer = async (blob: Blob) => {
    if (!session) return
    const question = session.questions[currentQuestionIndex]
    if (!question) return

    setIsUploading(true)
    setError(null)

    try {
      const extension = blob.type.split('/')[1]?.split(';')[0] || 'webm'
      const file = new File([blob], `answer-${question.id}.${extension}`, {
        type: blob.type,
      })

      const form = new FormData()
      form.append("audio", file)
      form.append("questionId", question.id)
      form.append("interviewSessionId", session.sessionId)

      const userId = userSession?.user?.id
      if (!userId) {
        throw new Error("Anda belum login")
      }

      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
        body: form,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || "Gagal mengirim jawaban ke AI")
      }

      const { data } = await res.json()
      const normalized = normalizeAnswer(data, question)

      setAnswers((prev) => {
        const updated = [...prev, normalized]
        const nextIndex = currentQuestionIndex + 1
        if (nextIndex < (session.questions?.length || 0)) {
          setCurrentQuestionIndex(nextIndex)
        } else {
          finalizeSession(updated)
        }
        return updated
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tak terduga")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRecordToggle = () => {
    if (isUploading) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleEndSession = () => {
    finalizeSession(answers)
  }

  const currentQuestion = session?.questions?.[currentQuestionIndex]
  const progressLabel = session
    ? `${currentQuestionIndex + 1}/${session.questions.length}`
    : "-"

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#f2f7f2] dark:bg-zinc-950 p-6 overflow-hidden font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      <div className="w-full flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-[#e4ebe4] dark:border-zinc-800 text-[#001e00] dark:text-zinc-100 shadow-sm">
            Time Remaining: {formatTime(timeLeft)}
          </span>
          <span className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-[#e4ebe4] dark:border-zinc-800 text-[#001e00] dark:text-zinc-100 shadow-sm">
            Question {progressLabel}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#5e6d55] hover:text-[#14a800] hover:bg-[#f2f7f2] rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-zinc-800"
          onClick={handleEndSession}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="grid w-full max-w-6xl gap-8 md:grid-cols-[1.5fr_1fr] flex-1 items-center py-8">
        <div className="flex items-center justify-center w-full relative h-full bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-[#e4ebe4] dark:border-zinc-800 overflow-hidden">
          <VoiceVisualizer active={isRecording || isUploading} className="scale-150 text-[#14a800]" />
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl h-full flex flex-col">
          <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
            <CardTitle className="flex items-center justify-between gap-3 text-lg font-medium text-[#001e00] dark:text-zinc-100">
              <span className="truncate">{session?.title || "AI Interview"}</span>
              <Badge variant="outline" className="border-[#e4ebe4] text-[#5e6d55] dark:border-zinc-700 dark:text-zinc-400 font-normal">
                {progressLabel} questions
              </Badge>
            </CardTitle>
            <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
              Answer with your voice, AI will provide feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 flex-1 flex flex-col overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-[#5e6d55] dark:text-zinc-500 font-semibold">Current Question</div>
                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <div className="flex items-center gap-1 text-xs text-[#14a800] font-medium">
                      <Volume2 className="h-3 w-3 animate-pulse" />
                      Speaking...
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#f2f7f2] rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-zinc-800"
                    onClick={() => currentQuestion && speakQuestion(currentQuestion.text)}
                    disabled={isSpeaking || !currentQuestion}
                    title="Repeat question"
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xl font-medium text-[#001e00] dark:text-zinc-100 leading-relaxed">
                {currentQuestion?.text || "Question not found"}
              </p>
            </div>

            <Separator className="bg-[#e4ebe4] dark:bg-zinc-800" />

            <div className="flex items-center gap-3 mt-auto">
              <Button
                className={cn(
                  "flex-1 h-12 text-base font-medium rounded-full shadow-sm transition-all",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-[#14a800] hover:bg-[#14a800]/90 text-white"
                )}
                onClick={handleRecordToggle}
                disabled={!session || isUploading}
              >
                {isRecording ? (
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
                className="h-12 w-12 rounded-full border-[#e4ebe4] text-[#5e6d55] hover:bg-[#f2f7f2] hover:text-[#001e00] dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                onClick={handleEndSession}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>

            {isUploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#5e6d55] dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-[#14a800]" />
                Sending answer to AI...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {answers.length > 0 && (
              <div className="space-y-3 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 text-sm font-medium text-[#5e6d55] dark:text-zinc-400">
                  <CheckCircle2 className="h-4 w-4 text-[#14a800]" />
                  {answers.length} answers saved
                </div>
                <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                  {answers.map((ans) => (
                    <div
                      key={ans.questionId}
                      className="rounded-xl border border-[#e4ebe4] bg-[#f9f9f9] p-3 text-sm space-y-1 dark:border-zinc-800 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-center justify-between text-xs text-[#5e6d55] dark:text-zinc-500">
                        <span className="font-medium truncate max-w-[70%]">{ans.question}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-normal border rounded-full px-2",
                            (ans.score || 0) >= 8 ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" :
                            (ans.score || 0) >= 6 ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900" :
                            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900"
                          )}
                        >
                          {ans.score ?? 0}/10
                        </Badge>
                      </div>
                      <p className="text-[#001e00] dark:text-zinc-300 line-clamp-2 text-xs">{ans.feedback || ans.transcription}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/authClient"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mic, MicOff, PhoneOff, X, Loader2, CheckCircle2, AlertCircle, Volume2, VolumeX, Eye, EyeOff, Minimize2, Maximize2 } from "lucide-react"
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
  const { data: userSession, isPending } = useSession()
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  )
  const resumeId = searchParams.get("resume")
  const [session, setSession] = React.useState<StoredSession | null>(null)
  const [isQuestionVisible, setIsQuestionVisible] = React.useState(true)
  const [isCardMinimized, setIsCardMinimized] = React.useState(false)

  React.useEffect(() => {
    if (!isPending && !userSession) {
      toast.error("Sesi Anda telah berakhir", {
        description: "Silakan login kembali untuk melanjutkan.",
      })
      router.push("/login")
    }
  }, [isPending, userSession, router])

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
  const [isLoading, setIsLoading] = React.useState(true)

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
      setIsLoading(true)
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
            }
          }
        } catch (err) {
          console.error("Failed to resume session:", err)
        } finally {
          setIsLoading(false)
        }
      } else {
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
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadSession()
  }, [router, resumeId, userSession?.user?.id])

  // Auto-speak question when it changes
  React.useEffect(() => {
    if (session?.questions?.[currentQuestionIndex] && !isLoading) {
      const text = session.questions[currentQuestionIndex].text
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        speakQuestion(text)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, isLoading, session])

  React.useEffect(() => {
    if (timeLeft <= 0 || isUploading) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isUploading])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Microphone access denied or not available")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        submitAnswer(audioBlob)
        
        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }
      }
    }
  }

  const submitAnswer = async (audioBlob: Blob) => {
    if (!session || !userSession?.user?.id) return

    setIsUploading(true)
    setError(null)

    const currentQ = session.questions[currentQuestionIndex]
    const formData = new FormData()
    formData.append("audio", audioBlob)
    formData.append("questionId", currentQ.id)
    formData.append("interviewSessionId", session.sessionId)
    formData.append("questionText", currentQ.text)
    formData.append("jobDesc", session.jobDesc) // Send job desc for context

    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "x-user-id": userSession.user.id,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to submit answer")
      }

      const { data } = await response.json()
      
      const newAnswer: AnswerSummary = {
        questionId: currentQ.id,
        question: currentQ.text,
        transcription: data.transcription,
        feedback: data.feedback,
        score: data.score,
        speechPace: data.speechPace,
        confidentLevel: data.confidentLevel,
        tips: data.tips,
        audioUrl: data.audioUrl
      }

      // Update answers state
      setAnswers((prev) => [...prev, newAnswer])
      
      // Determine next step
      const nextIndex = currentQuestionIndex + 1
      
      if (nextIndex < session.questions.length) {
        setCurrentQuestionIndex(nextIndex)
      } else {
        // Interview finished
        finalizeSession(session.sessionId)
      }

    } catch (err) {
      console.error(err)
      setError("Failed to process your answer. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const finalizeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/interview/${sessionId}/finish`, {
        method: "POST",
      })
      router.push(`/practice-interview/result?id=${sessionId}`)
    } catch (err) {
      console.error("Failed to finish session:", err)
    }
  }

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end the interview? Your progress will be saved.")) {
      router.push("/practice-interview")
    }
  }

  const normalizeAnswer = (ans: any, question: QuestionItem): AnswerSummary => {
    return {
      questionId: question.id,
      question: question.text,
      transcription: ans.transcription,
      feedback: ans.feedbackContent || ans.feedback, // Handle different field names
      score: ans.score,
      audioUrl: ans.audioUrl
    }
  }

  const currentQuestion = session?.questions?.[currentQuestionIndex]
  const progressLabel = session
    ? `${currentQuestionIndex + 1}/${session.questions.length}`
    : "-"

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f7f2] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#14a800]" />
          <p className="text-[#5e6d55] dark:text-zinc-400">Loading interview session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f2f7f2] dark:bg-zinc-950 font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      {/* Header */}
      <div className="w-full flex justify-between items-center max-w-6xl mx-auto p-6">
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

      {/* Main Content */}
      <div className={cn(
        "flex-1 w-full max-w-6xl mx-auto p-6 pt-0 gap-8 pb-8",
        isCardMinimized ? "flex flex-col h-full" : "grid lg:grid-cols-2 items-start lg:items-stretch"
      )}>
        
        {/* Visualizer Area */}
        <div className={cn(
          "flex flex-col items-center justify-center w-full relative min-h-[300px] bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-[#e4ebe4] dark:border-zinc-800 overflow-hidden order-2 lg:order-1 p-6 min-w-0",
          isCardMinimized ? "flex-1" : "lg:h-auto"
        )}>
          <div className="flex-1 flex items-center justify-center w-full pb-24">
            <VoiceVisualizer active={isRecording || isUploading} className="scale-150 text-[#14a800]" />
          </div>
          
          {/* Controls moved here */}
          <div className="w-full max-w-md flex items-center gap-3 mt-6 z-20">
            <Button
              className={cn(
                "flex-1 h-14 text-base font-medium rounded-full shadow-sm transition-all",
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
              className="h-14 w-14 rounded-full border-[#e4ebe4] text-[#5e6d55] hover:bg-[#f2f7f2] hover:text-[#001e00] dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              onClick={handleEndSession}
              title="End Interview"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Minimized Card Trigger */}
          {isCardMinimized && (
            <div 
              className="absolute top-6 right-6 z-10 cursor-pointer animate-in fade-in zoom-in duration-300"
              onClick={() => setIsCardMinimized(false)}
            >
              <div className="bg-white dark:bg-zinc-900 border border-[#e4ebe4] dark:border-zinc-800 shadow-lg rounded-2xl p-4 flex items-center gap-3 hover:scale-105 transition-transform">
                <div className="h-10 w-10 rounded-full bg-[#f2f7f2] dark:bg-zinc-800 flex items-center justify-center text-[#14a800]">
                  <Maximize2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-[#5e6d55] dark:text-zinc-400 uppercase">Current Question</span>
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
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl flex flex-col order-1 lg:order-2 h-auto lg:h-full min-w-0">
            <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <CardTitle className="flex items-center justify-between gap-3 text-lg font-medium text-[#001e00] dark:text-zinc-100">
                <span className="truncate">{session?.title || "AI Interview"}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#f2f7f2] rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-zinc-800"
                    onClick={() => setIsCardMinimized(true)}
                    title="Minimize card"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">
                Answer with your voice, AI will provide feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex-1 flex flex-col">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-[#5e6d55] dark:text-zinc-500 font-semibold">Current Question</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#5e6d55] hover:text-[#14a800] hover:bg-[#f2f7f2] rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-zinc-800"
                      onClick={() => setIsQuestionVisible(!isQuestionVisible)}
                      title={isQuestionVisible ? "Hide text" : "Show text"}
                    >
                      {isQuestionVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
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
                {isQuestionVisible ? (
                  <p className="text-xl font-medium text-[#001e00] dark:text-zinc-100 leading-relaxed">
                    {currentQuestion?.text || "Question not found"}
                  </p>
                ) : (
                  <div className="h-20 flex items-center justify-center text-[#5e6d55] dark:text-zinc-500 italic">
                    Question hidden. Listen to the audio.
                  </div>
                )}
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
                <div className="space-y-3 overflow-hidden flex flex-col max-h-[200px]">
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
        )}
      </div>
    </div>
  )
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/lib/authClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, ArrowRight, RotateCcw, Loader2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"

type Answer = {
  id: string
  transcription: string
  feedbackContent: string
  feedbackTone: string
  score: number
  speechPace: string
  confidentLevel: string
  tips: string
  questionId: string
}

type Question = {
  id: string
  text: string
  order: number
}

type InterviewData = {
  id: string
  title: string
  startedAt: string
  finishedAt: string | null
  totalScore: number | null
  questionSet: {
    id: string
    description: string
    questions: Question[]
  }
  answers: Answer[]
}

export default function InterviewResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [interview, setInterview] = React.useState<InterviewData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const interviewId = searchParams.get("id")

  React.useEffect(() => {
    if (!session?.user?.id || !interviewId) {
      setLoading(false)
      return
    }

    const fetchInterview = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`, {
          headers: {
            "x-user-id": session.user.id,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch interview data")
        }

        const { data } = await res.json()
        setInterview(data)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()
  }, [session, interviewId])

  const getScoreColor = (score: number) => {
    // Score in 1-10 scale from backend
    if (score >= 8) {
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
    }
    if (score >= 6) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900"
    }
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
  }

  const calculateAverageScore = () => {
    if (!interview?.answers || interview.answers.length === 0) return 0
    const total = interview.answers.reduce((sum, a) => sum + a.score, 0)
    return Math.round((total / interview.answers.length) * 10) // Convert 1-10 to 0-100
  }

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In Progress"
    const diff = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getTextColor = (score: number) => {
    if (score >= 80) return "text-[#14a800] dark:text-[#14a800]"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-500"
    return "text-red-600 dark:text-red-500"
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans transition-colors duration-300">
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
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">Results Not Available</CardTitle>
              <CardDescription className="text-red-600/80 dark:text-red-400/80">
                {error || "Interview data not found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="rounded-full bg-[#14a800] hover:bg-[#14a800]/90 text-white">
                <Link href="/practice-interview">Back to List</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const avgScore = calculateAverageScore()
  const duration = formatDuration(interview.startedAt, interview.finishedAt)
  
  // Map answers to questions
  const questionsWithAnswers = interview.questionSet.questions.map((q) => {
    const answer = interview.answers.find((a) => a.questionId === q.id)
    return {
      question: q,
      answer,
    }
  })

  return (
    <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100 md:text-4xl">Interview Results</h1>
          <p className="text-[#5e6d55] dark:text-zinc-400 text-lg">
            {interview.title}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#f9f9f9] dark:bg-zinc-800/50 border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <CardTitle className="text-[#001e00] dark:text-zinc-100 font-medium">Overall Score</CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">Based on your answers accuracy and clarity</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-baseline gap-2">
                <span className={`text-7xl font-bold tracking-tighter ${getTextColor(avgScore)}`}>{avgScore}</span>
                <span className="text-2xl text-[#5e6d55] dark:text-zinc-400 font-medium">/ 100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#f9f9f9] dark:bg-zinc-800/50 border-b border-[#e4ebe4] dark:border-zinc-800 pb-4">
              <CardTitle className="text-[#001e00] dark:text-zinc-100 font-medium">Session Details</CardTitle>
              <CardDescription className="text-[#5e6d55] dark:text-zinc-400">Duration and stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-8">
              <div className="flex justify-between items-center">
                <span className="text-[#5e6d55] dark:text-zinc-400 font-medium">Duration</span>
                <span className="font-semibold text-[#001e00] dark:text-zinc-100 text-lg">{duration}</span>
              </div>
              <Separator className="bg-[#e4ebe4] dark:bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-[#5e6d55] dark:text-zinc-400 font-medium">Questions Answered</span>
                <span className="font-semibold text-[#001e00] dark:text-zinc-100 text-lg">{interview.answers.length} / {interview.questionSet.questions.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-[#001e00] dark:text-zinc-100">Detailed Analysis</h2>
          <div className="grid gap-6">
            {questionsWithAnswers.map((item, idx) => {
              const { question, answer } = item
              
              return (
                <Card key={question.id} className="bg-white dark:bg-zinc-900 border-none shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="pb-4 border-b border-[#e4ebe4] dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-[#14a800] uppercase tracking-wide">Question {question.order}</div>
                        <CardTitle className="text-lg font-medium text-[#001e00] dark:text-zinc-100 leading-relaxed">
                          {question.text}
                        </CardTitle>
                      </div>
                      {answer && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(answer.score)}`}>
                          {answer.score}/10
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {answer ? (
                    <CardContent className="space-y-6 p-6">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-[#5e6d55] dark:text-zinc-400 uppercase tracking-wide">Your Answer</div>
                        <p className="text-base text-[#001e00] dark:text-zinc-200 leading-relaxed bg-[#f9f9f9] dark:bg-zinc-800/50 p-4 rounded-xl border border-[#e4ebe4] dark:border-zinc-800">
                          {answer.transcription || "(No transcription available)"}
                        </p>
                      </div>
                      <div className="bg-[#f2f7f2] dark:bg-zinc-800/30 p-6 rounded-xl border border-[#e4ebe4] dark:border-zinc-800 space-y-3">
                        <div className="flex items-center gap-2 text-base font-medium text-[#14a800]">
                          <CheckCircle2 className="h-5 w-5" />
                          AI Feedback
                        </div>
                        <p className="text-base text-[#001e00] dark:text-zinc-300 leading-relaxed">{answer.feedbackContent || "No feedback available"}</p>
                        {answer.tips && (
                          <div className="mt-4 pt-4 border-t border-[#d5e0d5] dark:border-zinc-700">
                            <p className="text-sm text-[#5e6d55] dark:text-zinc-400">
                              <strong className="text-[#001e00] dark:text-zinc-200">Tip:</strong> {answer.tips}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-6">
                      <p className="text-sm text-[#5e6d55] dark:text-zinc-400 italic">Not answered yet</p>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 pb-12">
          <Button variant="outline" asChild className="h-12 px-6 rounded-full border-[#e4ebe4] text-[#5e6d55] hover:bg-[#f2f7f2] hover:text-[#001e00] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <Link href="/practice-interview">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild className="h-12 px-6 rounded-full bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-sm hover:shadow-md transition-all">
            <Link href={`/practice-interview/start?parentId=${interview.id}&description=${encodeURIComponent(interview.questionSet.description)}`}>
              <RotateCcw className="mr-2 h-4 w-4" />
             interview again
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

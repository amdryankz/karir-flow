"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/authClient"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, RotateCcw, FileText } from "lucide-react"
import Link from "next/link"

type InterviewSession = {
  id: string
  title: string
  startedAt: string
  finishedAt?: string | null
  totalScore?: number | null
  questionSet: {
    id: string
    description: string
    questions: Array<{
      id: string
      text: string
      order: number
    }>
  }
  answers: Array<{
    id: string
    score: number
    transcription: string
    feedbackContent: string
  }>
}

export default function PracticeInterviewPage() {
  const { data: session, isPending } = useSession()
  const [interviews, setInterviews] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchInterviews = async () => {
      try {
        const response = await fetch("/api/interview", {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": session.user.id,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch interview session data")
        }

        const { data } = await response.json()
        setInterviews(data || [])
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Terjadi kesalahan")
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()
  }, [session])

  const getStatus = (interview: InterviewSession) => {
    const answers = interview.answers || []
    
    // Belum mulai - 0 jawaban
    if (answers.length === 0) {
      return "Pending"
    }
    
    // Hitung average score dari answers (score backend dalam skala 1-10)
    const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0)
    const avgScore = totalScore / answers.length
    
    // Status berdasarkan performance
    if (avgScore >= 8) return "Excellent"
    if (avgScore >= 6) return "Good"
    if (avgScore >= 4) return "Fair"
    return "Needs Work"
  }

  const getAverageScore = (interview: InterviewSession) => {
    // PATOKAN BACKEND: totalScore field (sudah dalam skala 0-100)
    if (interview.totalScore !== null && interview.totalScore !== undefined) {
      return interview.totalScore
    }
    
    // Fallback: hitung dari answers jika totalScore belum diset
    const answers = interview.answers
    if (!answers || answers.length === 0) return null
    const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0)
    const avgScore = totalScore / answers.length
    // Backend Gemini return 1-10, convert ke 0-100
    return Math.round(avgScore * 10)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  if (isPending || loading) {
    return (
      <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100">My Interviews</h1>
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
            </div>
          </div>
          <Card className="border-none shadow-md bg-white dark:bg-zinc-900 rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2 text-[#5e6d55] dark:text-zinc-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#14a800] border-t-transparent" />
                <p>Loading your history...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans transition-colors duration-300">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100">My Interviews</h1>
            <Button asChild className="rounded-full bg-[#14a800] hover:bg-[#14a800]/90 dark:text-white">
              <Link href="/practice-interview/start">Start New Interview</Link>
            </Button>
          </div>
          <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 shadow-sm">
            <CardContent className="flex items-center justify-center h-32 text-red-600 dark:text-red-400">
              {error}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f2f7f2] dark:bg-zinc-950 p-6 md:p-12 font-sans text-[#001e00] dark:text-zinc-100 transition-colors duration-300">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-[#001e00] dark:text-zinc-100 md:text-4xl">
              My Interviews
            </h1>
            <p className="mt-2 text-[#5e6d55] dark:text-zinc-400">
              Track your progress, review feedback, and keep improving.
            </p>
          </div>
          <Button asChild className="h-10 rounded-full bg-[#14a800] px-6 font-medium text-white hover:bg-[#14a800]/90 dark:text-white shadow-sm transition-all hover:shadow-md">
            <Link href="/practice-interview/start">Start New Interview</Link>
          </Button>
        </div>

        <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-zinc-900 rounded-2xl">
          <CardHeader className="border-b border-[#e4ebe4] dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-6">
            <CardTitle className="text-xl font-medium text-[#001e00] dark:text-zinc-100">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-[#f2f7f2] dark:bg-zinc-800 p-4">
                  <FileText className="h-8 w-8 text-[#14a800]" />
                </div>
                <h3 className="text-lg font-medium text-[#001e00] dark:text-zinc-100">No interviews yet</h3>
                <p className="mb-6 max-w-sm text-[#5e6d55] dark:text-zinc-400">
                  Start your first practice session to get AI-powered feedback on your answers.
                </p>
                <Button asChild variant="outline" className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#f2f7f2] dark:hover:bg-zinc-800 dark:hover:text-[#14a800]">
                  <Link href="/practice-interview/start">Start Your First Interview</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#f9f9f9] dark:bg-zinc-900/50">
                  <TableRow className="hover:bg-transparent border-b border-[#e4ebe4] dark:border-zinc-800">
                    <TableHead className="w-[60px] px-8 py-4 font-medium text-[#5e6d55] dark:text-zinc-400">No</TableHead>
                    <TableHead className="py-4 font-medium text-[#5e6d55] dark:text-zinc-400">Title</TableHead>
                    <TableHead className="py-4 font-medium text-[#5e6d55] dark:text-zinc-400">Date</TableHead>
                    <TableHead className="py-4 font-medium text-[#5e6d55] dark:text-zinc-400">Status</TableHead>
                    <TableHead className="py-4 font-medium text-[#5e6d55] dark:text-zinc-400">Score</TableHead>
                    <TableHead className="px-8 py-4 text-right font-medium text-[#5e6d55] dark:text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview, index) => {
                    const status = getStatus(interview)
                    const avgScore = getAverageScore(interview)

                    return (
                      <TableRow key={interview.id} className="border-b border-[#e4ebe4] dark:border-zinc-800 hover:bg-[#f2f7f2]/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="px-8 py-5 font-medium text-[#001e00] dark:text-zinc-100">{index + 1}</TableCell>
                        <TableCell className="py-5 font-medium text-[#001e00] dark:text-zinc-100">{interview.title}</TableCell>
                        <TableCell className="py-5 text-[#5e6d55] dark:text-zinc-400">{formatDate(interview.startedAt)}</TableCell>
                        <TableCell className="py-5">
                          <Badge
                            variant="outline"
                            className={
                              status === "Excellent"
                                ? "bg-green-50 text-green-700 border-green-200 rounded-full px-3 font-normal dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                : status === "Good"
                                ? "bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3 font-normal dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                : status === "Fair"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 rounded-full px-3 font-normal dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                : status === "Needs Work"
                                ? "bg-red-50 text-red-700 border-red-200 rounded-full px-3 font-normal dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                : "bg-gray-50 text-gray-700 border-gray-200 rounded-full px-3 font-normal dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5">
                          {avgScore !== null ? (
                            <span className="font-medium text-[#001e00] dark:text-zinc-100">{avgScore}/100</span>
                          ) : (
                            <span className="text-[#9aaa97] dark:text-zinc-600">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right space-x-2">
                          {/* Detail Button - always visible if has answers */}
                          {interview.answers && interview.answers.length > 0 && (
                            <Button variant="ghost" size="icon" asChild title="View Details" className="text-[#5e6d55] hover:text-[#14a800] hover:bg-[#f2f7f2] rounded-full dark:text-zinc-400 dark:hover:text-[#14a800] dark:hover:bg-zinc-800">
                              <Link href={`/practice-interview/result?id=${interview.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          
                          {/* Main Action Button */}
                          {interview.finishedAt ? (
                            <>
                              <Button variant="outline" size="sm" asChild className="rounded-full border-[#d5e0d5] text-[#001e00] hover:border-[#14a800] hover:text-[#14a800] hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                                <Link href={`/practice-interview/result?id=${interview.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Results
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="rounded-full border-[#d5e0d5] text-[#001e00] hover:border-[#14a800] hover:text-[#14a800] hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                                <Link href={`/practice-interview/start?parentId=${interview.id}&questionSetId=${interview.questionSet.id}&title=${encodeURIComponent(interview.title)}`}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Repeat
                                </Link>
                              </Button>
                            </>
                          ) : status === "Pending" ? (
                            <Button variant="outline" size="sm" asChild className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#f2f7f2] dark:hover:bg-zinc-800">
                              <Link href={`/practice-interview/session?resume=${interview.id}`}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Start
                              </Link>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" asChild className="rounded-full border-[#14a800] text-[#14a800] hover:bg-[#f2f7f2] dark:hover:bg-zinc-800">
                              <Link href={`/practice-interview/session?resume=${interview.id}`}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Repeat
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

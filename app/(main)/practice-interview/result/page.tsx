"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react"
import Link from "next/link"

// Dummy Data
const resultData = {
  totalScore: 85,
  duration: "04:55",
  overallSummary: {
    verdict: "Solid performance with clear explanations and steady pacing across all questions.",
    highlights: [
      "Strong grasp of core React concepts and state management",
      "Communicated answers concisely with relevant examples",
      "Maintained consistent confidence and structure in responses",
    ],
    focusAreas: [
      "Add more depth on performance implications and trade-offs",
      "Offer concrete examples when discussing patterns and tools",
      "Clarify how you validate and measure success in implementations",
    ],
  },
  questions: [
    {
      id: 1,
      question: "Can you explain the difference between React state and props?",
      answer: "State is internal data managed by the component, while props are external data passed to the component.",
      feedback: "Good explanation. You covered the key difference clearly.",
      score: 90,
      status: "good",
    },
    {
      id: 2,
      question: "How do you handle side effects in React?",
      answer: "I use the useEffect hook.",
      feedback: "Correct, but you could elaborate more on dependency arrays and cleanup functions.",
      score: 75,
      status: "average",
    },
    {
      id: 3,
      question: "What is the Virtual DOM?",
      answer: "It's a lightweight copy of the real DOM.",
      feedback: "Accurate. Mentioning the reconciliation process would make this answer stronger.",
      score: 88,
      status: "good",
    },
    {
      id: 4,
      question: "How would you optimize a React app's performance?",
      answer: "I start by profiling, then memoize expensive components and split bundles with dynamic imports.",
      feedback: "Good starting points. Mentioning useCallback/useMemo trade-offs and using React Profiler would strengthen this.",
      score: 82,
      status: "good",
    },
    {
      id: 5,
      question: "Describe how you secure API calls from the frontend.",
      answer: "I rely on HTTPS and send tokens in the Authorization header.",
      feedback: "Covers the basics. Add notes on token refresh, handling 401 flows, and avoiding secrets in the client.",
      score: 76,
      status: "average",
    },
  ],
}

export default function InterviewResultPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Interview Results</h1>
        <p className="text-muted-foreground">
          Here is the summary and analysis of your practice session.
        </p>
      </div>

      {/* Overall Score Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Overall Score</CardTitle>
            <CardDescription>Based on your answers accuracy and clarity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold text-primary">{resultData.totalScore}</span>
              <span className="text-xl text-muted-foreground">/ 100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Duration and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{resultData.duration}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions Answered</span>
              <span className="font-medium">{resultData.questions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Analysis</h2>
        <div className="grid gap-4">
          {resultData.questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Question {q.id}</CardTitle>
                    <CardDescription className="text-foreground font-medium">
                      {q.question}
                    </CardDescription>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    q.status === 'good' 
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900'
                  }`}>
                    {q.score}/100
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Your Answer</div>
                  <p className="text-sm">{q.answer}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    AI Feedback
                  </div>
                  <p className="text-sm text-muted-foreground">{q.feedback}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Interview Summary</CardTitle>
          <CardDescription>Condensed takeaways from all questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">AI Conclusion</div>
            <p className="text-sm">{resultData.overallSummary.verdict}</p>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Strengths</div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {resultData.overallSummary.highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Focus Areas</div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {resultData.overallSummary.focusAreas.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" asChild>
          <Link href="/practice-interview">
            <ArrowRight className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
        <Button asChild>
          <Link href="/practice-interview/start">
            <RotateCcw className="mr-2 h-4 w-4" />
            Practice Again
          </Link>
        </Button>
      </div>
    </div>
  )
}

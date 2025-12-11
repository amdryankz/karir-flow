"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Sparkles } from "lucide-react"

export default function StartInterviewPage() {
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [description, setDescription] = React.useState("")

  const handleStart = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirm = () => {
    router.push("/practice-interview/session")
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to History
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">New Interview Session</h1>
        <p className="text-muted-foreground">
          Configure your interview settings and provide context for the AI interviewer.
        </p>
      </div>

      <Card className="border-2 border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Interview Context
          </CardTitle>
          <CardDescription>
            Paste the job description, role requirements, or specific topics you want to practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Job Description / Context</Label>
            <Textarea
              id="description"
              placeholder="e.g. Senior Frontend Developer role at Tech Corp. Requirements: React, TypeScript, Node.js..."
              className="min-h-[200px] resize-none text-base p-4 focus-visible:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button 
            size="lg" 
            className="w-full text-lg font-semibold h-12 shadow-md hover:shadow-lg transition-all"
            onClick={handleStart}
            disabled={!description.trim()}
          >
            Start Interview Session
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you ready for the interview?</AlertDialogTitle>
            <AlertDialogDescription>
              The AI interviewer will start the session immediately. Make sure your microphone is ready.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
              I'm Ready
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

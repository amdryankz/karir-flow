"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, PhoneOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceVisualizer } from "@/components/voice-visualizer"

export default function InterviewSessionPage() {
  const router = useRouter()
  const [isListening, setIsListening] = React.useState(true)
  const [isSpeaking, setIsSpeaking] = React.useState(false) // AI speaking state
  const [timeLeft, setTimeLeft] = React.useState(5 * 60) // 5 minutes in seconds

  // Simulate AI speaking effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Randomly toggle AI speaking state for demo purposes
      if (Math.random() > 0.6) {
        setIsSpeaking(prev => !prev)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Timer Logic
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/practice-interview/result")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndSession = () => {
    router.push("/practice-interview/result")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white p-6 overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-white/70">
           <span>Time Remaining: {formatTime(timeLeft)}</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
          onClick={handleEndSession}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        <VoiceVisualizer active={isSpeaking} className="scale-150" />
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-md flex items-center justify-between px-8 pb-8">
         {/* Left Control (Mute) */}
         <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all",
              !isListening && "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            )}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          {/* Center Control (End Call - Prominent) */}
          <Button
            variant="destructive"
            size="icon"
            className="h-20 w-20 rounded-full shadow-lg hover:scale-105 transition-transform bg-red-500 hover:bg-red-600"
            onClick={handleEndSession}
          >
            <PhoneOff className="h-8 w-8 fill-white" />
          </Button>

           {/* Right Control (Placeholder) */}
           <div className="h-14 w-14" /> 
      </div>
    </div>
  )
}

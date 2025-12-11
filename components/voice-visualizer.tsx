"use client"

import { cn } from "@/lib/utils"

interface VoiceVisualizerProps {
  active: boolean
  className?: string
}

export function VoiceVisualizer({ active, className }: VoiceVisualizerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 h-16", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3 bg-white rounded-full transition-all duration-300 ease-in-out",
            active ? "animate-voice-bar" : "h-3"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: active ? undefined : "12px",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes voice-bar {
          0%, 100% {
            height: 12px;
          }
          50% {
            height: 48px;
          }
        }
        .animate-voice-bar {
          animation: voice-bar 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

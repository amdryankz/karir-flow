"use client";

import { cn } from "@/lib/utils";

interface VoiceVisualizerProps {
  active: boolean;
  volume?: number; // 0 to 1
  className?: string;
}

export function VoiceVisualizer({
  active,
  volume = 0,
  className,
}: VoiceVisualizerProps) {
  // Create 5 bars with different sensitivity/phase
  const bars = [0.6, 1.0, 0.8, 1.0, 0.6];

  return (
    <div
      className={cn("flex items-center justify-center gap-1.5 h-16", className)}
    >
      {bars.map((multiplier, i) => {
        // Calculate height based on volume and multiplier
        // Base height is 12px. Max height is 48px.
        // If active but no volume (e.g. loading/processing), use animation
        // If active and volume (recording), use volume

        let height = 12;
        let isAnimating = false;

        if (active) {
          if (volume > 0) {
            // Dynamic height based on volume
            // Add some randomness/noise to make it look more organic
            const noise = Math.random() * 0.2;
            const effectiveVolume = Math.max(
              0.1,
              Math.min(1, volume * multiplier + noise)
            );
            height = 12 + effectiveVolume * 36; // 12 + (0..1 * 36) = 12..48
          } else {
            // Fallback animation if volume is 0 but active (or just very quiet)
            isAnimating = true;
          }
        }

        return (
          <div
            key={i}
            className={cn(
              "w-3 bg-current rounded-full transition-all duration-75 ease-out",
              isAnimating ? "animate-voice-bar" : ""
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: isAnimating ? undefined : `${height}px`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes voice-bar {
          0%,
          100% {
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
  );
}

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  type?: string;
  speaker_id?: string;
}

interface SpeakerTimelineProps {
  words: TranscriptWord[];
}

interface TimelineSegment {
  speaker: string;
  start: number;
  end: number;
}

const SPEAKER_LABELS: Record<string, string> = {
  speaker_0: "Customer",
  speaker_1: "Agent",
  speaker_2: "Speaker 3",
  speaker_3: "Speaker 4",
};

const SPEAKER_COLORS: Record<string, string> = {
  speaker_0: "bg-primary",
  speaker_1: "bg-[hsl(var(--speaker-2))]",
  speaker_2: "bg-[hsl(var(--speaker-3))]",
  speaker_3: "bg-[hsl(var(--speaker-4))]",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SpeakerTimeline({ words }: SpeakerTimelineProps) {
  const segments = useMemo(() => {
    const result: TimelineSegment[] = [];
    let currentSpeaker = "";
    let segStart = 0;
    let segEnd = 0;

    for (const word of words) {
      if (word.type === "audio_event") continue;
      const speaker = word.speaker_id || "speaker_0";
      if (speaker !== currentSpeaker) {
        if (currentSpeaker) {
          result.push({ speaker: currentSpeaker, start: segStart, end: segEnd });
        }
        currentSpeaker = speaker;
        segStart = word.start;
      }
      segEnd = word.end;
    }
    if (currentSpeaker) {
      result.push({ speaker: currentSpeaker, start: segStart, end: segEnd });
    }
    return result;
  }, [words]);

  if (!segments.length) return null;

  const totalDuration = segments[segments.length - 1]?.end || 1;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Speaker Timeline</h3>
      </div>
      <div className="p-4 space-y-2">
        {/* Visual bar */}
        <div className="flex h-8 rounded-lg overflow-hidden gap-px bg-muted">
          {segments.map((seg, i) => {
            const width = ((seg.end - seg.start) / totalDuration) * 100;
            const colorClass = SPEAKER_COLORS[seg.speaker] || "bg-primary";
            return (
              <div
                key={i}
                className={cn("h-full transition-all hover:opacity-80", colorClass)}
                style={{ width: `${Math.max(width, 0.5)}%` }}
                title={`${SPEAKER_LABELS[seg.speaker] || seg.speaker} ${formatTime(seg.start)} - ${formatTime(seg.end)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-muted-foreground">{formatTime(0)}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(totalDuration)}</span>
        </div>

        {/* Segment list */}
        <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
          {segments.map((seg, i) => {
            const colorClass = SPEAKER_COLORS[seg.speaker] || "bg-primary";
            const duration = seg.end - seg.start;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-muted-foreground w-12 shrink-0">{formatTime(seg.start)}</span>
                <span className="text-foreground w-16 shrink-0 font-medium">{SPEAKER_LABELS[seg.speaker] || seg.speaker}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", colorClass)}
                    style={{ width: `${Math.min((duration / (totalDuration * 0.3)) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">{Math.round(duration)}s</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

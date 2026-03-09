import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  type?: string;
  speaker_id?: string;
}

interface TranscriptData {
  text: string;
  words: TranscriptWord[];
}

interface TranscriptDisplayProps {
  data: TranscriptData;
}

const SPEAKER_COLORS: Record<string, string> = {
  "speaker_0": "text-[hsl(var(--speaker-1))]",
  "speaker_1": "text-[hsl(var(--speaker-2))]",
  "speaker_2": "text-[hsl(var(--speaker-3))]",
  "speaker_3": "text-[hsl(var(--speaker-4))]",
};

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getSpeakerLabel(speakerId: string): string {
  const num = parseInt(speakerId.replace("speaker_", ""), 10);
  return `Speaker ${num + 1}`;
}

interface Segment {
  speaker: string;
  startTime: number;
  text: string;
}

function buildSegments(words: TranscriptWord[]): Segment[] {
  const segments: Segment[] = [];
  let currentSpeaker = "";
  let currentText = "";
  let currentStart = 0;

  for (const word of words) {
    if (word.type === "audio_event") continue;
    
    const speaker = word.speaker_id || "speaker_0";
    
    if (speaker !== currentSpeaker && currentText.trim()) {
      segments.push({ speaker: currentSpeaker, startTime: currentStart, text: currentText.trim() });
      currentText = "";
    }
    
    if (speaker !== currentSpeaker || !currentText) {
      currentSpeaker = speaker;
      currentStart = word.start;
    }
    
    currentText += word.text + " ";
  }

  if (currentText.trim()) {
    segments.push({ speaker: currentSpeaker, startTime: currentStart, text: currentText.trim() });
  }

  return segments;
}

export function TranscriptDisplay({ data }: TranscriptDisplayProps) {
  const segments = useMemo(() => buildSegments(data.words || []), [data.words]);

  if (!segments.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-center">{data.text || "No transcript available."}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Transcript</h2>
        <p className="text-xs text-muted-foreground mt-1">{segments.length} segments · {data.words?.length || 0} words</p>
      </div>
      <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
        {segments.map((seg, i) => {
          const colorClass = SPEAKER_COLORS[seg.speaker] || "text-primary";
          return (
            <div key={i} className="p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0 mt-0.5">
                  {formatTimestamp(seg.startTime)}
                </span>
                <div>
                  <span className={cn("text-sm font-semibold", colorClass)}>
                    {getSpeakerLabel(seg.speaker)}:
                  </span>
                  <span className="text-sm text-foreground ml-2">{seg.text}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

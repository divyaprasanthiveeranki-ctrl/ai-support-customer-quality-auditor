import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  keywords?: string[];
}

const SPEAKER_STYLES: Record<string, { bubble: string; name: string; label: string; align: string }> = {
  speaker_0: {
    bubble: "bg-primary/10 border-primary/20",
    name: "text-primary",
    label: "Agent",
    align: "items-start",
  },
  speaker_1: {
    bubble: "bg-[hsl(var(--speaker-2)/0.1)] border-[hsl(var(--speaker-2)/0.2)]",
    name: "text-[hsl(var(--speaker-2))]",
    label: "Customer",
    align: "items-end",
  },
  speaker_2: {
    bubble: "bg-[hsl(var(--speaker-3)/0.1)] border-[hsl(var(--speaker-3)/0.2)]",
    name: "text-[hsl(var(--speaker-3))]",
    label: "Speaker 3",
    align: "items-start",
  },
  speaker_3: {
    bubble: "bg-[hsl(var(--speaker-4)/0.1)] border-[hsl(var(--speaker-4)/0.2)]",
    name: "text-[hsl(var(--speaker-4))]",
    label: "Speaker 4",
    align: "items-start",
  },
};

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords?.length) return text;
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (keywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
      return (
        <mark key={i} className="bg-[hsl(var(--speaker-3)/0.2)] text-[hsl(var(--speaker-3))] rounded px-0.5 font-medium">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function TranscriptDisplay({ data, keywords = [] }: TranscriptDisplayProps) {
  const segments = useMemo(() => buildSegments(data.words || []), [data.words]);

  if (!segments.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-center">{data.text || "No transcript available."}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-sm">Conversation</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{segments.length} turns · {data.words?.length || 0} words</p>
      </div>
      <ScrollArea className="h-[55vh]">
        <div className="p-4 space-y-3">
          {segments.map((seg, i) => {
            const style = SPEAKER_STYLES[seg.speaker] || SPEAKER_STYLES.speaker_0;
            const isAgent = seg.speaker === "speaker_0";
            return (
              <div key={i} className={cn("flex flex-col", style.align)}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", style.bubble, "border")}>
                    {style.label[0]}
                  </div>
                  <span className={cn("text-xs font-semibold", style.name)}>{style.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{formatTimestamp(seg.startTime)}</span>
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 border text-sm leading-relaxed",
                  style.bubble,
                  isAgent ? "rounded-tr-sm" : "rounded-tl-sm"
                )}>
                  💬 {highlightKeywords(seg.text, keywords)}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

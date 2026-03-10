import { Clock, Users, MessageSquare, UserCheck, AlertTriangle, TrendingUp } from "lucide-react";

interface CallInsightsProps {
  words?: any[];
  insights?: {
    totalSentences?: number;
    longestSpeakerTurn?: string;
    interruptions?: number;
    emotionChanges?: number;
  };
}

function calculateDuration(words: any[]): number {
  if (!words?.length) return 0;
  const validWords = words.filter((w: any) => w.type !== "audio_event");
  if (!validWords.length) return 0;
  return validWords[validWords.length - 1].end - validWords[0].start;
}

function countSpeakers(words: any[]): number {
  const speakers = new Set<string>();
  for (const w of words || []) {
    if (w.type !== "audio_event" && w.speaker_id) speakers.add(w.speaker_id);
  }
  return Math.max(speakers.size, 1);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function CallInsights({ words = [], insights }: CallInsightsProps) {
  const duration = calculateDuration(words);
  const speakers = countSpeakers(words);

  const metrics = [
    { icon: Clock, label: "Total Duration", value: formatDuration(duration), color: "text-primary" },
    { icon: Users, label: "Total Speakers", value: String(speakers), color: "text-[hsl(var(--speaker-2))]" },
    { icon: MessageSquare, label: "Total Sentences", value: String(insights?.totalSentences || "—"), color: "text-[hsl(var(--speaker-3))]" },
    { icon: UserCheck, label: "Longest Turn", value: insights?.longestSpeakerTurn || "—", color: "text-primary" },
    { icon: AlertTriangle, label: "Interruptions", value: String(insights?.interruptions ?? "—"), color: "text-[hsl(var(--speaker-4))]" },
    { icon: TrendingUp, label: "Emotion Changes", value: String(insights?.emotionChanges ?? "—"), color: "text-[hsl(var(--speaker-3))]" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Call Insights</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

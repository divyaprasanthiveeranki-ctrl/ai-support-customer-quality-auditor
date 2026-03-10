import { cn } from "@/lib/utils";

export interface EmotionPoint {
  timestamp: number;
  emotion: string;
  confidence: number;
}

interface EmotionTimelineProps {
  emotions: EmotionPoint[];
  onTimestampClick?: (timestamp: number) => void;
}

const EMOTION_CONFIG: Record<string, { emoji: string; color: string; bg: string; barColor: string; level: number }> = {
  neutral: { emoji: "😐", color: "text-muted-foreground", bg: "bg-muted", barColor: "bg-muted-foreground/50", level: 1 },
  calm: { emoji: "🙂", color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", barColor: "bg-[hsl(var(--speaker-2))]", level: 0 },
  happy: { emoji: "😊", color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", barColor: "bg-[hsl(var(--speaker-2))]", level: 0 },
  satisfied: { emoji: "😌", color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", barColor: "bg-[hsl(var(--speaker-2))]", level: 0 },
  frustrated: { emoji: "😟", color: "text-[hsl(var(--speaker-3))]", bg: "bg-[hsl(var(--speaker-3)/0.15)]", barColor: "bg-[hsl(var(--speaker-3))]", level: 2 },
  confused: { emoji: "😕", color: "text-[hsl(var(--speaker-1))]", bg: "bg-[hsl(var(--speaker-1)/0.15)]", barColor: "bg-[hsl(var(--speaker-1))]", level: 2 },
  angry: { emoji: "😠", color: "text-[hsl(var(--speaker-4))]", bg: "bg-[hsl(var(--speaker-4)/0.15)]", barColor: "bg-[hsl(var(--speaker-4))]", level: 3 },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function EmotionTimeline({ emotions, onTimestampClick }: EmotionTimelineProps) {
  if (!emotions?.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground text-sm">No emotion data available.</p>
      </div>
    );
  }

  const maxLevel = 3;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Emotion Timeline</h3>
        <div className="flex flex-wrap gap-3 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-1.5 rounded-full bg-[hsl(var(--speaker-2))]" /> Calm
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-1.5 rounded-full bg-[hsl(var(--speaker-3))]" /> Frustrated
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-3 h-1.5 rounded-full bg-[hsl(var(--speaker-4))]" /> Angry
          </span>
        </div>
      </div>

      {/* Color bar timeline */}
      <div className="px-4 pt-4">
        <div className="flex items-end gap-0.5 h-16">
          {emotions.map((point, i) => {
            const cfg = EMOTION_CONFIG[point.emotion.toLowerCase()] || EMOTION_CONFIG.neutral;
            const height = ((cfg.level + 1) / (maxLevel + 1)) * 100;
            return (
              <button
                key={i}
                onClick={() => onTimestampClick?.(point.timestamp)}
                className={cn("flex-1 rounded-t transition-all hover:opacity-70 cursor-pointer min-w-[6px]", cfg.barColor)}
                style={{ height: `${height}%` }}
                title={`${formatTime(point.timestamp)} — ${cfg.emoji} ${point.emotion}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1 mb-3">
          <span className="text-[10px] text-muted-foreground">{formatTime(emotions[0]?.timestamp || 0)}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(emotions[emotions.length - 1]?.timestamp || 0)}</span>
        </div>
      </div>

      {/* Emoji list */}
      <div className="border-t border-border max-h-40 overflow-y-auto divide-y divide-border">
        {emotions.map((point, i) => {
          const cfg = EMOTION_CONFIG[point.emotion.toLowerCase()] || EMOTION_CONFIG.neutral;
          return (
            <button
              key={i}
              onClick={() => onTimestampClick?.(point.timestamp)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent/30 transition-colors text-left"
            >
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {formatTime(point.timestamp)}
              </span>
              <span className="text-base">{cfg.emoji}</span>
              <span className={cn("text-xs font-medium capitalize", cfg.color)}>
                {point.emotion}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {Math.round(point.confidence * 100)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

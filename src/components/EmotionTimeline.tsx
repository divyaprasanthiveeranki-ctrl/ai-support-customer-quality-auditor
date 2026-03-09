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

const EMOTION_CONFIG: Record<string, { color: string; bg: string; level: number }> = {
  neutral: { color: "text-muted-foreground", bg: "bg-muted", level: 1 },
  calm: { color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", level: 0 },
  happy: { color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", level: 0 },
  frustrated: { color: "text-[hsl(var(--speaker-3))]", bg: "bg-[hsl(var(--speaker-3)/0.15)]", level: 2 },
  angry: { color: "text-[hsl(var(--speaker-4))]", bg: "bg-[hsl(var(--speaker-4)/0.15)]", level: 3 },
  confused: { color: "text-[hsl(var(--speaker-1))]", bg: "bg-[hsl(var(--speaker-1)/0.15)]", level: 2 },
  satisfied: { color: "text-[hsl(var(--speaker-2))]", bg: "bg-[hsl(var(--speaker-2)/0.15)]", level: 0 },
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
        <p className="text-muted-foreground text-sm">No emotion data available. Process a call to see the emotion timeline.</p>
      </div>
    );
  }

  const maxLevel = 3;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Customer Emotion Timeline</h3>
        <div className="flex flex-wrap gap-3 mt-2">
          {Object.entries(EMOTION_CONFIG).map(([emotion, cfg]) => (
            <div key={emotion} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", cfg.bg, "border border-current", cfg.color)} />
              <span className="text-xs text-muted-foreground capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual bar chart */}
      <div className="p-4">
        <div className="flex items-end gap-1 h-24">
          {emotions.map((point, i) => {
            const cfg = EMOTION_CONFIG[point.emotion.toLowerCase()] || EMOTION_CONFIG.neutral;
            const height = ((cfg.level + 1) / (maxLevel + 1)) * 100;
            return (
              <button
                key={i}
                onClick={() => onTimestampClick?.(point.timestamp)}
                className={cn(
                  "flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer min-w-[8px]",
                  cfg.bg, "border border-b-0", cfg.color
                )}
                style={{ height: `${height}%` }}
                title={`${formatTime(point.timestamp)} — ${point.emotion}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{formatTime(emotions[0]?.timestamp || 0)}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(emotions[emotions.length - 1]?.timestamp || 0)}</span>
        </div>
      </div>

      {/* List view */}
      <div className="border-t border-border max-h-48 overflow-y-auto divide-y divide-border">
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
              <span className={cn("text-xs font-medium capitalize px-2 py-0.5 rounded", cfg.bg, cfg.color)}>
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

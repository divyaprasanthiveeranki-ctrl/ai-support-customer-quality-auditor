import { cn } from "@/lib/utils";

interface QualityScores {
  greetingQuality?: number;
  empathy?: number;
  problemUnderstanding?: number;
  resolutionClarity?: number;
  professionalism?: number;
  overallScore?: number;
}

interface QualityScorecardProps {
  scores: QualityScores | null;
}

const SCORE_ITEMS: { key: keyof QualityScores; label: string }[] = [
  { key: "greetingQuality", label: "Greeting Quality" },
  { key: "empathy", label: "Empathy" },
  { key: "problemUnderstanding", label: "Problem Understanding" },
  { key: "resolutionClarity", label: "Resolution Clarity" },
  { key: "professionalism", label: "Professionalism" },
];

function getScoreColor(score: number): string {
  if (score >= 8) return "bg-[hsl(var(--speaker-2))]";
  if (score >= 5) return "bg-[hsl(var(--speaker-3))]";
  return "bg-[hsl(var(--speaker-4))]";
}

function getOverallColor(score: number): string {
  if (score >= 75) return "text-[hsl(var(--speaker-2))]";
  if (score >= 50) return "text-[hsl(var(--speaker-3))]";
  return "text-[hsl(var(--speaker-4))]";
}

export function QualityScorecard({ scores }: QualityScorecardProps) {
  if (!scores) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground text-sm">No quality data available.</p>
      </div>
    );
  }

  const overall = scores.overallScore || 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Call Quality Scorecard</h3>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", getOverallColor(overall))}>{overall}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {SCORE_ITEMS.map(({ key, label }) => {
          const score = scores[key] || 0;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground">{score}/10</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getScoreColor(score))}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

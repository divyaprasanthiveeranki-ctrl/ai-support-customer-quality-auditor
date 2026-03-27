import { useCallContext } from "@/contexts/CallContext";
import { QualityScorecard } from "@/components/QualityScorecard";
import { CallInsights } from "@/components/CallInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function ScorePage() {
  const { selectedCall, summaryData } = useCallContext();

  if (!selectedCall) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quality Score</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed quality scoring breakdown</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No call selected</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Upload and select a call to view quality scores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overall = summaryData?.qualityScores?.overallScore || 0;
  const scoreColor =
    overall >= 75 ? "text-[hsl(var(--speaker-2))]" :
    overall >= 50 ? "text-[hsl(var(--speaker-3))]" :
    "text-[hsl(var(--speaker-4))]";
  const ringColor =
    overall >= 75 ? "stroke-[hsl(var(--speaker-2))]" :
    overall >= 50 ? "stroke-[hsl(var(--speaker-3))]" :
    "stroke-[hsl(var(--speaker-4))]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quality Score</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scoring: <span className="font-medium text-foreground">{selectedCall.file_name}</span>
        </p>
      </div>

      {/* Large circular score */}
      <Card>
        <CardContent className="flex flex-col items-center py-10">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-muted" />
              <circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="10"
                className={ringColor}
                strokeLinecap="round"
                strokeDasharray={`${(overall / 100) * 327} 327`}
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColor}`}>{overall}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Overall Quality Score</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualityScorecard scores={summaryData?.qualityScores || null} />
        <CallInsights words={selectedCall.transcript_data?.words} insights={summaryData?.insights} />
      </div>
    </div>
  );
}

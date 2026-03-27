import { useCallContext } from "@/contexts/CallContext";
import { SmartSummary } from "@/components/SmartSummary";
import { CallInsights } from "@/components/CallInsights";
import { EmotionTimeline } from "@/components/EmotionTimeline";
import { KeywordHighlights } from "@/components/KeywordHighlights";
import { ExportReport } from "@/components/ExportReport";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalysisPage() {
  const { selectedCall, summaryData } = useCallContext();
  const keywords = summaryData?.keywords || [];

  if (!selectedCall) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered call analysis and insights</p>
        </div>
        <EmptyState icon={BarChart3} text="Upload and select a call from the Upload page to view AI analysis." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyzing: <span className="font-medium text-foreground">{selectedCall.file_name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartSummary data={summaryData} />
        <CallInsights words={selectedCall.transcript_data?.words} insights={summaryData?.insights} />
        <div className="lg:col-span-2">
          <EmotionTimeline emotions={selectedCall.emotion_data || []} />
        </div>
        <div className="lg:col-span-2">
          <KeywordHighlights keywords={keywords} />
        </div>
        <div className="lg:col-span-2">
          <ExportReport callRecord={selectedCall} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof BarChart3; text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">No call selected</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{text}</p>
      </CardContent>
    </Card>
  );
}

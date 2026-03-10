import { Copy, Tag, CheckCircle2, TrendingUp, AlertCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SummaryData {
  summary: string;
  issue?: string;
  actionTaken?: string;
  category: string;
  resolution: string;
  resolutionDetail?: string;
  sentiment: string;
  keyInsights: string[];
  keywords?: any[];
  qualityScores?: any;
  insights?: any;
}

interface SmartSummaryProps {
  data: SummaryData | null;
}

export function SmartSummary({ data }: SmartSummaryProps) {
  if (!data) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground text-sm">No summary available. Process a call to generate insights.</p>
      </div>
    );
  }

  const handleCopy = () => {
    const text = `Issue: ${data.issue || "N/A"}\nAction Taken: ${data.actionTaken || "N/A"}\nResolution: ${data.resolution}\nCategory: ${data.category}\nSentiment: ${data.sentiment}\n\nSummary:\n${data.summary}\n\nKey Insights:\n${data.keyInsights.map((k) => `• ${k}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  const sentimentColor =
    data.sentiment.toLowerCase().includes("positive")
      ? "text-[hsl(var(--speaker-2))]"
      : data.sentiment.toLowerCase().includes("negative")
        ? "text-[hsl(var(--speaker-4))]"
        : "text-muted-foreground";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">AI Call Summary</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Issue */}
        {data.issue && (
          <div className="bg-[hsl(var(--speaker-4)/0.05)] border border-[hsl(var(--speaker-4)/0.15)] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--speaker-4))]" />
              <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--speaker-4))] font-semibold">Issue</span>
            </div>
            <p className="text-sm text-foreground">{data.issue}</p>
          </div>
        )}

        {/* Action Taken */}
        {data.actionTaken && (
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Action Taken</span>
            </div>
            <p className="text-sm text-foreground">{data.actionTaken}</p>
          </div>
        )}

        {/* Resolution */}
        <div className="bg-[hsl(var(--speaker-2)/0.05)] border border-[hsl(var(--speaker-2)/0.15)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--speaker-2))]" />
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--speaker-2))] font-semibold">Resolution</span>
          </div>
          <p className="text-sm text-foreground">{data.resolutionDetail || data.resolution}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Category</span>
            </div>
            <p className="text-xs font-medium text-foreground mt-0.5">{data.category}</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Sentiment</span>
            </div>
            <p className={`text-xs font-medium mt-0.5 ${sentimentColor}`}>{data.sentiment}</p>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</h4>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>

        {/* Key insights */}
        {data.keyInsights?.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Insights</h4>
            <ul className="space-y-1.5">
              {data.keyInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

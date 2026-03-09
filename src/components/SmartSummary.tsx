import { Copy, Download, Tag, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SummaryData {
  summary: string;
  category: string;
  resolution: string;
  sentiment: string;
  keyInsights: string[];
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
    const text = `Category: ${data.category}\nResolution: ${data.resolution}\nSentiment: ${data.sentiment}\n\nSummary:\n${data.summary}\n\nKey Insights:\n${data.keyInsights.map((k) => `• ${k}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  const handleDownload = () => {
    const text = `CALL SUMMARY REPORT\n${"=".repeat(40)}\n\nCategory: ${data.category}\nResolution: ${data.resolution}\nSentiment: ${data.sentiment}\n\nSummary:\n${data.summary}\n\nKey Insights:\n${data.keyInsights.map((k) => `• ${k}`).join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "call-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
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
        <h3 className="font-semibold text-foreground text-sm">Smart Summary</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Meta cards */}
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Category:</span>
            <span className="text-xs font-medium text-foreground">{data.category}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Resolution:</span>
            <span className="text-xs font-medium text-foreground">{data.resolution}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Sentiment:</span>
            <span className={`text-xs font-medium ${sentimentColor}`}>{data.sentiment}</span>
          </div>
        </div>

        {/* Summary text */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h4>
          <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
        </div>

        {/* Key insights */}
        {data.keyInsights?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</h4>
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

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Keyword {
  word: string;
  category?: string;
  count?: number;
}

interface KeywordHighlightsProps {
  keywords: Keyword[] | null;
}

const CATEGORY_STYLES: Record<string, string> = {
  issue: "bg-[hsl(var(--speaker-4)/0.1)] text-[hsl(var(--speaker-4))] border-[hsl(var(--speaker-4)/0.2)]",
  action: "bg-[hsl(var(--speaker-2)/0.1)] text-[hsl(var(--speaker-2))] border-[hsl(var(--speaker-2)/0.2)]",
  sentiment: "bg-[hsl(var(--speaker-3)/0.1)] text-[hsl(var(--speaker-3))] border-[hsl(var(--speaker-3)/0.2)]",
  product: "bg-primary/10 text-primary border-primary/20",
};

export function KeywordHighlights({ keywords }: KeywordHighlightsProps) {
  if (!keywords?.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Keyword Highlights</h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">NLP-extracted key terms</p>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {keywords.map((kw, i) => {
          const style = CATEGORY_STYLES[kw.category || "issue"] || CATEGORY_STYLES.issue;
          return (
            <span
              key={i}
              className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", style)}
            >
              <AlertTriangle className="w-3 h-3" />
              {kw.word}
              {kw.count && kw.count > 1 && (
                <span className="opacity-60">×{kw.count}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

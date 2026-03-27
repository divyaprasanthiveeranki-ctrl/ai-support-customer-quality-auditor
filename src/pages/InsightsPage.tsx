import { useCallContext } from "@/contexts/CallContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";

export default function InsightsPage() {
  const { calls, selectedCall, summaryData } = useCallContext();

  // Aggregate insights from all analyzed calls
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  const allSuggestions: string[] = [];

  const source = selectedCall ? [selectedCall] : calls;
  for (const call of source) {
    const sd = call.summary_data as any;
    if (!sd) continue;
    const qs = sd.qualityScores;
    if (qs) {
      if (qs.empathy >= 8) allStrengths.push(`Strong empathy in "${call.file_name}"`);
      if (qs.greetingQuality >= 8) allStrengths.push(`Great greeting in "${call.file_name}"`);
      if (qs.professionalism >= 8) allStrengths.push(`Professional tone in "${call.file_name}"`);
      if (qs.empathy < 5) allWeaknesses.push(`Low empathy in "${call.file_name}"`);
      if (qs.resolutionClarity < 5) allWeaknesses.push(`Unclear resolution in "${call.file_name}"`);
      if (qs.greetingQuality < 5) allWeaknesses.push(`Weak greeting in "${call.file_name}"`);
    }
    if (sd.keyInsights) {
      for (const insight of sd.keyInsights) {
        if (!allSuggestions.includes(insight)) allSuggestions.push(insight);
      }
    }
  }

  const sections = [
    { title: "Strengths", icon: ThumbsUp, items: allStrengths, emptyText: "No strengths identified yet. Upload and analyze calls.", color: "text-[hsl(var(--speaker-2))]", bgColor: "bg-[hsl(var(--speaker-2))]/10" },
    { title: "Weaknesses", icon: ThumbsDown, items: allWeaknesses, emptyText: "No weaknesses found yet.", color: "text-[hsl(var(--speaker-4))]", bgColor: "bg-[hsl(var(--speaker-4))]/10" },
    { title: "Suggestions", icon: Sparkles, items: allSuggestions, emptyText: "No suggestions available yet.", color: "text-primary", bgColor: "bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedCall ? `Insights for: ${selectedCall.file_name}` : "Aggregated insights across all calls"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                  <section.icon className={`w-4 h-4 ${section.color}`} />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.items.length > 0 ? (
                <ul className="space-y-2">
                  {section.items.slice(0, 8).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${section.bgColor.replace('/10', '')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{section.emptyText}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

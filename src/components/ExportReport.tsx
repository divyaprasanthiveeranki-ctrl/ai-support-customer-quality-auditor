import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportReportProps {
  callRecord: {
    file_name: string;
    transcript_data: any;
    emotion_data: any;
    summary_data: any;
    created_at: string;
  } | null;
}

export function ExportReport({ callRecord }: ExportReportProps) {
  if (!callRecord) return null;

  const handleExport = () => {
    const summary = callRecord.summary_data;
    const emotions = callRecord.emotion_data;
    const words = callRecord.transcript_data?.words || [];
    const qualityScores = summary?.qualityScores;
    const insights = summary?.insights;

    // Build transcript text
    let transcriptLines: string[] = [];
    let currentSpeaker = "";
    let currentText = "";
    let currentStart = 0;

    for (const word of words) {
      if (word.type === "audio_event") continue;
      const speaker = word.speaker_id || "speaker_0";
      if (speaker !== currentSpeaker && currentText.trim()) {
        const m = Math.floor(currentStart / 60);
        const s = Math.floor(currentStart % 60);
        const ts = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        const label = currentSpeaker === "speaker_1" ? "Agent" : "Customer";
        transcriptLines.push(`[${ts}] ${label}: ${currentText.trim()}`);
        currentText = "";
      }
      if (speaker !== currentSpeaker || !currentText) {
        currentSpeaker = speaker;
        currentStart = word.start;
      }
      currentText += word.text + " ";
    }
    if (currentText.trim()) {
      const m = Math.floor(currentStart / 60);
      const s = Math.floor(currentStart % 60);
      const ts = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      const label = currentSpeaker === "speaker_1" ? "Agent" : "Customer";
      transcriptLines.push(`[${ts}] ${label}: ${currentText.trim()}`);
    }

    const sections = [
      `CALLSCRIBE REPORT`,
      `${"=".repeat(50)}`,
      `File: ${callRecord.file_name}`,
      `Date: ${new Date(callRecord.created_at).toLocaleString()}`,
      ``,
    ];

    if (summary) {
      sections.push(
        `AI CALL SUMMARY`,
        `${"-".repeat(30)}`,
        `Issue: ${summary.issue || "N/A"}`,
        `Action Taken: ${summary.actionTaken || "N/A"}`,
        `Resolution: ${summary.resolution || "N/A"} — ${summary.resolutionDetail || ""}`,
        `Category: ${summary.category || "N/A"}`,
        `Sentiment: ${summary.sentiment || "N/A"}`,
        ``,
        `Summary: ${summary.summary || "N/A"}`,
        ``,
        `Key Insights:`,
        ...(summary.keyInsights || []).map((k: string) => `  • ${k}`),
        ``
      );
    }

    if (qualityScores) {
      sections.push(
        `QUALITY SCORECARD`,
        `${"-".repeat(30)}`,
        `Greeting Quality:      ${qualityScores.greetingQuality}/10`,
        `Empathy:               ${qualityScores.empathy}/10`,
        `Problem Understanding: ${qualityScores.problemUnderstanding}/10`,
        `Resolution Clarity:    ${qualityScores.resolutionClarity}/10`,
        `Professionalism:       ${qualityScores.professionalism}/10`,
        `Overall Score:         ${qualityScores.overallScore}/100`,
        ``
      );
    }

    if (insights) {
      sections.push(
        `CALL INSIGHTS`,
        `${"-".repeat(30)}`,
        `Total Sentences:     ${insights.totalSentences || "N/A"}`,
        `Longest Speaker:     ${insights.longestSpeakerTurn || "N/A"}`,
        `Interruptions:       ${insights.interruptions ?? "N/A"}`,
        `Emotion Changes:     ${insights.emotionChanges ?? "N/A"}`,
        ``
      );
    }

    if (emotions?.length) {
      sections.push(
        `EMOTION TIMELINE`,
        `${"-".repeat(30)}`,
        ...emotions.map((e: any) => {
          const m = Math.floor(e.timestamp / 60);
          const s = Math.floor(e.timestamp % 60);
          return `  ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}  ${e.emotion} (${Math.round(e.confidence * 100)}%)`;
        }),
        ``
      );
    }

    sections.push(
      `TRANSCRIPT`,
      `${"-".repeat(30)}`,
      ...transcriptLines,
    );

    const blob = new Blob([sections.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `callscribe-report-${callRecord.file_name.replace(/\.[^/.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <Button onClick={handleExport} className="w-full gap-2" variant="outline">
      <Download className="w-4 h-4" />
      Download Full Report
    </Button>
  );
}

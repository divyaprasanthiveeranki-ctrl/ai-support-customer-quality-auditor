import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardAudioUploader } from "@/components/DashboardAudioUploader";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { EmotionTimeline } from "@/components/EmotionTimeline";
import { SmartSummary, type SummaryData } from "@/components/SmartSummary";
import { SpeakerPieChart } from "@/components/SpeakerPieChart";
import { SpeakerTimeline } from "@/components/SpeakerTimeline";
import { CallInsights } from "@/components/CallInsights";
import { QualityScorecard } from "@/components/QualityScorecard";
import { KeywordHighlights } from "@/components/KeywordHighlights";
import { ExportReport } from "@/components/ExportReport";
import { CompliancePanel, type ComplianceData } from "@/components/CompliancePanel";
import { FileAudio, LogOut, User, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface CallRecord {
  id: string;
  file_name: string;
  transcript_data: any;
  emotion_data: any;
  summary_data: any;
  compliance_data: any;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);

  const fetchCalls = useCallback(async () => {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setCalls(data as CallRecord[]);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const selectedCall = calls.find((c) => c.id === selectedCallId);

  const buildTranscriptText = (transcriptData: any): string => {
    const words = transcriptData?.words || [];
    if (words.length === 0) return transcriptData?.text || "";

    const segments: string[] = [];
    let currentSpeaker = "";
    let currentText = "";
    let currentStart = 0;

    for (const word of words) {
      if (word.type === "audio_event") continue;
      const speaker = word.speaker_id || "speaker_0";
      if (speaker !== currentSpeaker && currentText.trim()) {
        const mins = Math.floor(currentStart / 60);
        const secs = Math.floor(currentStart % 60);
        const ts = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        const num = parseInt(currentSpeaker.replace("speaker_", ""), 10) + 1;
        segments.push(`[${ts}] Speaker ${num}: ${currentText.trim()}`);
        currentText = "";
      }
      if (speaker !== currentSpeaker || !currentText) {
        currentSpeaker = speaker;
        currentStart = word.start;
      }
      currentText += word.text + " ";
    }
    if (currentText.trim()) {
      const mins = Math.floor(currentStart / 60);
      const secs = Math.floor(currentStart % 60);
      const ts = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      const num = parseInt(currentSpeaker.replace("speaker_", ""), 10) + 1;
      segments.push(`[${ts}] Speaker ${num}: ${currentText.trim()}`);
    }
    return segments.join("\n");
  };

  const runComplianceCheck = async () => {
    if (!selectedCall?.transcript_data) return;
    setIsCheckingCompliance(true);
    try {
      const transcriptText = buildTranscriptText(selectedCall.transcript_data);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compliance-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            transcript_text: transcriptText,
            transcription_id: selectedCall.id,
          }),
        }
      );

      if (!response.ok) throw new Error("Compliance check failed");
      const result = await response.json();

      setCalls((prev) =>
        prev.map((c) =>
          c.id === selectedCall.id ? { ...c, compliance_data: result } : c
        )
      );
      toast.success("Compliance check complete!");
    } catch (err: any) {
      console.error("Compliance check error:", err);
      toast.error("Failed to run compliance check");
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const analyzeTranscript = async (transcriptData: any, transcriptionId: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ transcript: transcriptData, transcription_id: transcriptionId }),
        }
      );

      if (!response.ok) throw new Error("Analysis failed");
      const analysis = await response.json();

      setCalls((prev) =>
        prev.map((c) =>
          c.id === transcriptionId
            ? {
                ...c,
                emotion_data: analysis.emotions,
                summary_data: {
                  ...analysis.summary,
                  keywords: analysis.keywords,
                  qualityScores: analysis.qualityScores,
                  insights: analysis.insights,
                },
              }
            : c
        )
      );
      toast.success("Analysis complete!");
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error("Failed to analyze transcript");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranscriptReceived = async (data: any, fileName: string) => {
    const { data: inserted, error } = await supabase
      .from("transcriptions")
      .insert({
        user_id: user!.id,
        file_name: fileName,
        transcript_data: data,
      })
      .select()
      .single();

    if (error) {
      console.error("Save error:", error);
      toast.error("Failed to save transcription");
      return;
    }

    const record = inserted as CallRecord;
    setCalls((prev) => [record, ...prev]);
    setSelectedCallId(record.id);
    analyzeTranscript(data, record.id);
  };

  const summaryData = selectedCall?.summary_data as SummaryData | null;
  const keywords = summaryData?.keywords || [];
  const keywordWords = keywords.map((k: any) => k.word);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card shrink-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileAudio className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">CallScribe</h1>
              <p className="text-[10px] text-muted-foreground">AI Call Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[hsl(var(--speaker-4))] rounded-full" />
            </Button>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="h-8 text-xs">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        <aside className="w-72 border-r border-border bg-card overflow-hidden shrink-0 hidden md:flex md:flex-col">
          <ScrollArea className="flex-1 p-4">
            <DashboardAudioUploader
              calls={calls}
              selectedCallId={selectedCallId}
              onCallSelect={setSelectedCallId}
              onTranscriptReceived={handleTranscriptReceived}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              onCallsChange={fetchCalls}
            />
          </ScrollArea>
        </aside>

        {/* Center panel */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Mobile upload */}
              <div className="md:hidden">
                <DashboardAudioUploader
                  calls={calls}
                  selectedCallId={selectedCallId}
                  onCallSelect={setSelectedCallId}
                  onTranscriptReceived={handleTranscriptReceived}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  onCallsChange={fetchCalls}
                />
              </div>

              {selectedCall ? (
                <>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 py-3 px-4 bg-primary/5 border border-primary/15 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <p className="text-sm text-foreground">Analyzing call with AI…</p>
                    </div>
                  )}

                  {selectedCall.transcript_data && (
                    <TranscriptDisplay data={selectedCall.transcript_data} keywords={keywordWords} />
                  )}

                  {selectedCall.transcript_data?.words && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <SpeakerTimeline words={selectedCall.transcript_data.words} />
                      <SpeakerPieChart words={selectedCall.transcript_data.words} />
                    </div>
                  )}

                  <EmotionTimeline emotions={selectedCall.emotion_data || []} />
                  <KeywordHighlights keywords={keywords} />

                  {/* Mobile-only right panel content */}
                  <div className="lg:hidden space-y-4">
                    <SmartSummary data={summaryData} />
                    <CallInsights words={selectedCall.transcript_data?.words} insights={summaryData?.insights} />
                    <QualityScorecard scores={summaryData?.qualityScores || null} />
                    <CompliancePanel
                      data={selectedCall.compliance_data as ComplianceData | null}
                      isChecking={isCheckingCompliance}
                      onRunCheck={runComplianceCheck}
                      hasTranscript={!!selectedCall.transcript_data}
                    />
                    <ExportReport callRecord={selectedCall} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <FileAudio className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">No call selected</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload a call recording or select one from the left panel to view the analysis
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        {/* Right panel */}
        <aside className="w-80 border-l border-border bg-card overflow-hidden shrink-0 hidden lg:flex lg:flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <SmartSummary data={summaryData} />
              <CallInsights words={selectedCall?.transcript_data?.words} insights={summaryData?.insights} />
              <QualityScorecard scores={summaryData?.qualityScores || null} />
              <CompliancePanel
                data={selectedCall?.compliance_data as ComplianceData | null}
                isChecking={isCheckingCompliance}
                onRunCheck={runComplianceCheck}
                hasTranscript={!!selectedCall?.transcript_data}
              />
              <ExportReport callRecord={selectedCall || null} />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

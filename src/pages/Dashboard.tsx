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
import { FileAudio, LogOut, User, Loader2, Upload, BarChart3, Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CallRecord {
  id: string;
  file_name: string;
  transcript_data: any;
  emotion_data: any;
  summary_data: any;
  compliance_data: any;
  created_at: string;
}

type TabKey = "upload" | "analysis" | "score" | "compliance";

const TABS: { key: TabKey; label: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "analysis", label: "Analysis", icon: BarChart3 },
  { key: "score", label: "Score", icon: Award },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("upload");

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
      {/* Header */}
      <header className="border-b border-border bg-card shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <FileAudio className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">CallScribe</h1>
              <p className="text-[11px] text-muted-foreground">AI Call Quality Auditor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all",
                  activeTab === tab.key
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload area */}
              <div className="lg:col-span-1">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <DashboardAudioUploader
                      calls={calls}
                      selectedCallId={selectedCallId}
                      onCallSelect={(id) => {
                        setSelectedCallId(id);
                      }}
                      onTranscriptReceived={handleTranscriptReceived}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                      onCallsChange={fetchCalls}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Transcript */}
              <div className="lg:col-span-2 space-y-6">
                {isAnalyzing && (
                  <Card className="border-primary/20 bg-primary/5 shadow-sm">
                    <CardContent className="flex items-center gap-3 p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="text-sm font-medium text-foreground">Analyzing call with AI…</p>
                    </CardContent>
                  </Card>
                )}

                {selectedCall?.transcript_data ? (
                  <TranscriptDisplay data={selectedCall.transcript_data} keywords={keywordWords} />
                ) : (
                  <Card className="shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <FileAudio className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground mb-1">No call selected</h2>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Upload a call recording or select one from the list to view the transcript
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedCall?.transcript_data?.words && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SpeakerTimeline words={selectedCall.transcript_data.words} />
                    <SpeakerPieChart words={selectedCall.transcript_data.words} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === "analysis" && (
            <div className="space-y-6">
              {!selectedCall ? (
                <EmptyState icon={BarChart3} title="No call selected" description="Upload and select a call from the Upload tab to view AI analysis." />
              ) : (
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
              )}
            </div>
          )}

          {/* Score Tab */}
          {activeTab === "score" && (
            <div className="space-y-6">
              {!selectedCall ? (
                <EmptyState icon={Award} title="No call selected" description="Upload and select a call from the Upload tab to view quality scores." />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <QualityScorecard scores={summaryData?.qualityScores || null} />
                  <CallInsights words={selectedCall.transcript_data?.words} insights={summaryData?.insights} />
                </div>
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              {!selectedCall ? (
                <EmptyState icon={ShieldCheck} title="No call selected" description="Upload and select a call from the Upload tab to run compliance checks." />
              ) : (
                <div className="max-w-2xl mx-auto">
                  <CompliancePanel
                    data={selectedCall.compliance_data as ComplianceData | null}
                    isChecking={isCheckingCompliance}
                    onRunCheck={runComplianceCheck}
                    hasTranscript={!!selectedCall.transcript_data}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Upload; title: string; description: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

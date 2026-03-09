import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardAudioUploader } from "@/components/DashboardAudioUploader";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { EmotionTimeline } from "@/components/EmotionTimeline";
import { SmartSummary, type SummaryData } from "@/components/SmartSummary";
import { FileAudio, LogOut, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CallRecord {
  id: string;
  file_name: string;
  transcript_data: any;
  emotion_data: any;
  summary_data: any;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

      // Update local state
      setCalls((prev) =>
        prev.map((c) =>
          c.id === transcriptionId
            ? { ...c, emotion_data: analysis.emotions, summary_data: analysis.summary }
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
    // Save to database
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

    // Auto-analyze
    analyzeTranscript(data, record.id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileAudio className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-base font-bold text-foreground">CallScribe</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="h-8">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Upload & manage */}
        <aside className="w-72 border-r border-border bg-card p-4 overflow-y-auto shrink-0 hidden md:block">
          <DashboardAudioUploader
            calls={calls}
            selectedCallId={selectedCallId}
            onCallSelect={setSelectedCallId}
            onTranscriptReceived={handleTranscriptReceived}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            onCallsChange={fetchCalls}
          />
        </aside>

        {/* Center panel: Transcript + Emotions */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
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
              {/* Emotion timeline */}
              <EmotionTimeline emotions={selectedCall.emotion_data || []} />

              {isAnalyzing && (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing emotions & generating summary…</p>
                </div>
              )}

              {/* Transcript */}
              {selectedCall.transcript_data && (
                <TranscriptDisplay data={selectedCall.transcript_data} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <FileAudio className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Upload a call recording or select one from the list</p>
            </div>
          )}
        </main>

        {/* Right panel: Smart Summary */}
        <aside className="w-80 border-l border-border bg-card p-4 overflow-y-auto shrink-0 hidden lg:block">
          <SmartSummary data={selectedCall?.summary_data || null} />
        </aside>
      </div>

      {/* Mobile summary (show below on smaller screens) */}
      {selectedCall?.summary_data && (
        <div className="lg:hidden p-4 border-t border-border">
          <SmartSummary data={selectedCall.summary_data} />
        </div>
      )}
    </div>
  );
}

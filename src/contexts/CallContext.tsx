import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CallRecord {
  id: string;
  file_name: string;
  transcript_data: any;
  emotion_data: any;
  summary_data: any;
  compliance_data: any;
  created_at: string;
}

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

interface CallContextType {
  calls: CallRecord[];
  selectedCallId: string | null;
  selectedCall: CallRecord | undefined;
  summaryData: SummaryData | null;
  isProcessing: boolean;
  isAnalyzing: boolean;
  isCheckingCompliance: boolean;
  setSelectedCallId: (id: string | null) => void;
  setIsProcessing: (v: boolean) => void;
  fetchCalls: () => Promise<void>;
  handleTranscriptReceived: (data: any, fileName: string) => Promise<void>;
  runComplianceCheck: () => Promise<void>;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallContext must be inside CallProvider");
  return ctx;
}

function buildTranscriptText(transcriptData: any): string {
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
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
    if (!error && data) setCalls(data as CallRecord[]);
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const selectedCall = calls.find((c) => c.id === selectedCallId);
  const summaryData = (selectedCall?.summary_data as SummaryData | null) ?? null;

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
      .insert({ user_id: user!.id, file_name: fileName, transcript_data: data })
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
          body: JSON.stringify({ transcript_text: transcriptText, transcription_id: selectedCall.id }),
        }
      );
      if (!response.ok) throw new Error("Compliance check failed");
      const result = await response.json();
      setCalls((prev) =>
        prev.map((c) => c.id === selectedCall.id ? { ...c, compliance_data: result } : c)
      );
      toast.success("Compliance check complete!");
    } catch (err: any) {
      console.error("Compliance check error:", err);
      toast.error("Failed to run compliance check");
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  return (
    <CallContext.Provider
      value={{
        calls, selectedCallId, selectedCall, summaryData,
        isProcessing, isAnalyzing, isCheckingCompliance,
        setSelectedCallId, setIsProcessing, fetchCalls,
        handleTranscriptReceived, runComplianceCheck,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

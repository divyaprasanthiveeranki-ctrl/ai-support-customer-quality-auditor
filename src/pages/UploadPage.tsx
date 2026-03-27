import { useCallContext } from "@/contexts/CallContext";
import { DashboardAudioUploader } from "@/components/DashboardAudioUploader";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { SpeakerTimeline } from "@/components/SpeakerTimeline";
import { SpeakerPieChart } from "@/components/SpeakerPieChart";
import { Card, CardContent } from "@/components/ui/card";
import { FileAudio, Loader2 } from "lucide-react";

export default function UploadPage() {
  const {
    calls, selectedCallId, selectedCall, summaryData,
    isProcessing, isAnalyzing, setSelectedCallId,
    setIsProcessing, fetchCalls, handleTranscriptReceived,
  } = useCallContext();

  const keywords = summaryData?.keywords || [];
  const keywordWords = keywords.map((k: any) => k.word);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload and transcribe call recordings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <DashboardAudioUploader
                calls={calls}
                selectedCallId={selectedCallId}
                onCallSelect={setSelectedCallId}
                onTranscriptReceived={handleTranscriptReceived}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onCallsChange={fetchCalls}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isAnalyzing && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 p-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Analyzing call with AI…</p>
              </CardContent>
            </Card>
          )}

          {selectedCall?.transcript_data ? (
            <TranscriptDisplay data={selectedCall.transcript_data} keywords={keywordWords} />
          ) : (
            <Card>
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
    </div>
  );
}

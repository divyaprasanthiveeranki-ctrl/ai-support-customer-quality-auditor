import { useState } from "react";
import { AudioUploader } from "@/components/AudioUploader";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { FileAudio } from "lucide-react";

const Index = () => {
  const [transcript, setTranscript] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <FileAudio className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CallScribe</h1>
            <p className="text-xs text-muted-foreground">AI-powered call transcription with speaker detection</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upload Recording</h2>
          <AudioUploader
            onTranscriptReceived={setTranscript}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        </section>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Transcribing audio with speaker detection…</p>
          </div>
        )}

        {transcript && !isProcessing && (
          <section>
            <TranscriptDisplay data={transcript} />
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;

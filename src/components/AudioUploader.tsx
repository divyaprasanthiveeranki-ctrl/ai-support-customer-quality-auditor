import { useState, useCallback } from "react";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AudioUploaderProps {
  onTranscriptReceived: (data: any) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"];
const MAX_SIZE = 20 * 1024 * 1024;

export function AudioUploader({ onTranscriptReceived, isProcessing, setIsProcessing }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(mp3|wav|m4a)$/i)) {
      toast.error("Please upload an MP3, WAV, or M4A file.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File must be under 20MB.");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Transcription failed");
      }

      const data = await response.json();
      onTranscriptReceived(data);
      toast.success("Transcription complete!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to transcribe audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
          dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50",
          isProcessing && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (isProcessing) return;
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".mp3,.wav,.m4a";
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) handleFile(f);
          };
          input.click();
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
            <Upload className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Drop your audio file here</p>
            <p className="text-sm text-muted-foreground mt-1">MP3, WAV, or M4A — up to 20MB</p>
          </div>
        </div>
      </div>

      {file && (
        <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileAudio className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          </div>
          <Button onClick={handleUpload} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : (
              "Transcribe"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

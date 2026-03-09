import { useState, useCallback } from "react";
import { Upload, FileAudio, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CallRecord {
  id: string;
  file_name: string;
  created_at: string;
}

interface DashboardAudioUploaderProps {
  calls: CallRecord[];
  selectedCallId: string | null;
  onCallSelect: (id: string) => void;
  onTranscriptReceived: (data: any, fileName: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  onCallsChange: () => void;
}

const ACCEPTED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"];
const MAX_SIZE = 20 * 1024 * 1024;

export function DashboardAudioUploader({
  calls,
  selectedCallId,
  onCallSelect,
  onTranscriptReceived,
  isProcessing,
  setIsProcessing,
  onCallsChange,
}: DashboardAudioUploaderProps) {
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
      onTranscriptReceived(data, file.name);
      setFile(null);
      toast.success("Transcription complete!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to transcribe audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("transcriptions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete call");
    } else {
      toast.success("Call deleted");
      onCallsChange();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Recording</h2>

      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
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
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Drop audio or click to browse</p>
        </div>
      </div>

      {file && (
        <div className="flex items-center gap-2 bg-accent/50 rounded-lg p-3">
          <FileAudio className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <Button size="sm" onClick={handleUpload} disabled={isProcessing} className="h-7 text-xs">
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Transcribe"}
          </Button>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 py-3">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Processing…</p>
        </div>
      )}

      {/* Call history */}
      {calls.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Calls</h3>
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => onCallSelect(call.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                  selectedCallId === call.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                )}
              >
                <FileAudio className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{call.file_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(call.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(call.id, e)}
                  className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  type?: string;
  speaker_id?: string;
}

interface SpeakerPieChartProps {
  words: TranscriptWord[];
}

const SPEAKER_LABELS: Record<string, string> = {
  speaker_0: "Customer",
  speaker_1: "Agent",
  speaker_2: "Speaker 3",
  speaker_3: "Speaker 4",
};

const COLORS = [
  "hsl(243, 75%, 59%)",
  "hsl(160, 60%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(340, 75%, 55%)",
];

export function SpeakerPieChart({ words }: SpeakerPieChartProps) {
  const speakerData = useMemo(() => {
    const speakerTime: Record<string, number> = {};
    for (const word of words) {
      if (word.type === "audio_event") continue;
      const speaker = word.speaker_id || "speaker_0";
      const duration = word.end - word.start;
      speakerTime[speaker] = (speakerTime[speaker] || 0) + duration;
    }
    const totalTime = Object.values(speakerTime).reduce((a, b) => a + b, 0);
    return Object.entries(speakerTime).map(([speaker, time], i) => ({
      name: SPEAKER_LABELS[speaker] || `Speaker ${i + 1}`,
      value: Math.round(time),
      percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0,
      color: COLORS[i % COLORS.length],
    }));
  }, [words]);

  if (!speakerData.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Speaker Distribution</h3>
      </div>
      <div className="p-4">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={speakerData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {speakerData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}s`, "Duration"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 mt-3">
          {speakerData.map((speaker, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: speaker.color }} />
                <span className="text-foreground font-medium">{speaker.name}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{speaker.percentage}%</span>
                <span>{speaker.value}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, transcription_id } = await req.json();

    if (!transcript || !transcription_id) {
      return new Response(
        JSON.stringify({ error: "Missing transcript or transcription_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const words = transcript.words || [];
    let transcriptText = transcript.text || "";

    if (words.length > 0) {
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
      transcriptText = segments.join("\n");
    }

    const prompt = `Analyze this customer support call transcript. Return ONLY valid JSON with no markdown formatting.

TRANSCRIPT:
${transcriptText}

Return this exact JSON structure:
{
  "emotions": [
    {"timestamp": <seconds_number>, "emotion": "<neutral|calm|happy|frustrated|angry|confused|satisfied>", "confidence": <0_to_1>}
  ],
  "summary": {
    "summary": "<2-3 sentence summary of the call>",
    "issue": "<what the customer reported>",
    "actionTaken": "<what the agent did>",
    "resolution": "<Resolved|Unresolved|Escalated|Pending>",
    "resolutionDetail": "<brief description of how it was resolved>",
    "category": "<e.g. Technical Support, Billing, Account Issue>",
    "sentiment": "<Positive|Negative|Neutral|Mixed>",
    "keyInsights": ["<insight1>", "<insight2>", "<insight3>"]
  },
  "keywords": [
    {"word": "<important keyword or phrase>", "category": "<issue|action|sentiment|product>", "count": <occurrences>}
  ],
  "qualityScores": {
    "greetingQuality": <1-10>,
    "empathy": <1-10>,
    "problemUnderstanding": <1-10>,
    "resolutionClarity": <1-10>,
    "professionalism": <1-10>,
    "overallScore": <1-100>
  },
  "insights": {
    "totalSentences": <number>,
    "longestSpeakerTurn": "<Speaker 1 or Speaker 2>",
    "interruptions": <number>,
    "emotionChanges": <number>
  }
}

For emotions: Create one entry per speaker turn/segment, mapping the customer's emotional state at that point.
For keywords: Extract 5-8 important words or short phrases from the conversation that highlight the key topics.
For qualityScores: Rate the agent's performance in each category.
For insights: Provide call analytics metrics.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert call center analyst. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    await supabaseClient
      .from("transcriptions")
      .update({
        emotion_data: analysis.emotions,
        summary_data: {
          ...analysis.summary,
          keywords: analysis.keywords,
          qualityScores: analysis.qualityScores,
          insights: analysis.insights,
        },
      })
      .eq("id", transcription_id);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analyze error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const { transcript_text, transcription_id } = await req.json();

    if (!transcript_text || !transcription_id) {
      return new Response(
        JSON.stringify({ error: "Missing transcript_text or transcription_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Fetch all KB documents
    const { data: kbDocs, error: kbError } = await supabaseClient
      .from("kb_documents")
      .select("rule, content, source");

    if (kbError) {
      console.error("KB fetch error:", kbError);
      throw new Error("Failed to fetch knowledge base");
    }

    // Build KB context for the AI
    const kbContext = (kbDocs || [])
      .map((d: any, i: number) => `Rule ${i + 1} [${d.source}]: ${d.rule}\n${d.content}`)
      .join("\n\n");

    // Normalize speaker labels: speaker_0 = Agent, speaker_1 = Customer
    // The transcript may arrive as "Speaker 1:"/"Speaker 2:" (1-based) from buildTranscriptText,
    // where Speaker 1 = speaker_0 = Agent and Speaker 2 = speaker_1 = Customer.
    const normalizedTranscript = transcript_text
      .replace(/\bSpeaker 1\b/g, "Agent")
      .replace(/\bSpeaker 2\b/g, "Customer")
      .replace(/\bspeaker_0\b/g, "Agent")
      .replace(/\bspeaker_1\b/g, "Customer");

    const prompt = `You are a call center compliance auditor. Analyze this transcript against the company's SOP rules and knowledge base.

IMPORTANT ROLE DEFINITIONS:
- "Agent" = the support representative whose performance is being evaluated
- "Customer" = the caller/client
All compliance rules apply to the AGENT's behavior only. Do not penalize the agent for things the customer says or does.

KNOWLEDGE BASE & SOP RULES:
${kbContext}

TRANSCRIPT:
${normalizedTranscript}

Return ONLY valid JSON with no markdown:
{
  "overallScore": <0-100 compliance score>,
  "status": "<Compliant|Minor Violations|Major Violations|Critical Breach>",
  "violations": [
    {
      "rule": "<which rule was violated>",
      "severity": "<low|medium|high|critical>",
      "description": "<what the agent did or failed to do, with a quote from the transcript>",
      "timestamp": "<approximate time in transcript if available>",
      "recommendation": "<what the agent should have done instead>"
    }
  ],
  "passed": [
    {
      "rule": "<rule that was followed>",
      "note": "<brief note on how the agent met this rule, with a quote if possible>"
    }
  ],
  "recommendations": ["<improvement suggestion 1>", "<improvement suggestion 2>"]
}

Check every rule against the Agent's lines only. If a rule doesn't apply to this call, skip it. Be specific about violations with evidence from the Agent's lines in the transcript.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert compliance auditor for customer support. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI compliance check failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let complianceResult;
    try {
      complianceResult = JSON.parse(content);
    } catch {
      console.error("Failed to parse compliance response:", content);
      throw new Error("Invalid AI response format");
    }

    // Save to database
    await supabaseClient
      .from("transcriptions")
      .update({ compliance_data: complianceResult })
      .eq("id", transcription_id);

    return new Response(JSON.stringify(complianceResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Compliance check error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

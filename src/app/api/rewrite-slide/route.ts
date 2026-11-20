import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RewriteRequestSchema = z.object({
  slideType: z.enum(["cover", "kpi", "chart", "block"]),
  action: z.enum(["shorten", "detail", "executive"]),
  content: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RewriteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { slideType, action, content } = parsed.data;

    const actionInstructions = {
      shorten: "Shorten and punch up all headlines, bullets, and narrative text. Cut word count by 30-50% while maximizing viral LinkedIn or boardroom engagement. Do NOT alter any numerical values or metrics.",
      detail: "Add rigorous analytical nuance, context, and explanatory clarity to headlines and narratives. Provide deeper cause-and-effect reasoning. Do NOT alter any numerical values or metrics.",
      executive: "Rephrase with authoritative, C-suite executive briefing tone. Use precise business terminology (EBITDA velocity, operational leverage, gross retention, margin resilience). Do NOT alter any numerical values or metrics.",
    }[action];

    const promptText = `
You are the world-class executive presentation copywriter for StatDeck.
TASK: Rewrite the text fields for this specific slide.
ACTION: ${action.toUpperCase()} - ${actionInstructions}

SLIDE TYPE: ${slideType}
CURRENT SLIDE DATA:
${JSON.stringify(content, null, 2)}

STRICT RULES:
1. Maintain the exact same JSON keys and structure as the input.
2. Only rewrite string text fields (e.g. title, subtitle, narrative, chartInsight, headline, detail, bullets, description).
3. NEVER change, scale, or hallucinate numerical figures or metric values.
4. Output ONLY valid JSON matching the exact shape of the input content.
`;

    // Attempt Gemini or OpenRouter call
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawOutput) {
            const rewritten = JSON.parse(rawOutput);
            return NextResponse.json({ success: true, rewritten });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini slide rewrite call failed, trying OpenRouter fallback:", geminiErr);
      }
    }

    if (openRouterKey) {
      try {
        const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
        const res = await fetch(openRouterUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.5-flash-lite",
            messages: [{ role: "user", content: promptText }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawOutput = data.choices?.[0]?.message?.content;
          if (rawOutput) {
            const rewritten = JSON.parse(rawOutput);
            return NextResponse.json({ success: true, rewritten });
          }
        }
      } catch (openRouterErr) {
        console.warn("OpenRouter slide rewrite call failed:", openRouterErr);
      }
    }

    // Deterministic fallback if keys are offline
    const fallbackCopy = JSON.parse(JSON.stringify(content));
    if (action === "shorten") {
      if (typeof fallbackCopy.title === "string") {
        fallbackCopy.title = fallbackCopy.title.split(":")[0];
      }
      if (typeof fallbackCopy.chartInsight === "string") {
        fallbackCopy.chartInsight = fallbackCopy.chartInsight.slice(0, 80) + "...";
      }
    } else if (action === "executive") {
      if (typeof fallbackCopy.title === "string" && !fallbackCopy.title.includes("Strategic")) {
        fallbackCopy.title = `Executive Overview: ${fallbackCopy.title}`;
      }
    }

    return NextResponse.json({ success: true, rewritten: fallbackCopy });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Slide rewrite failed" },
      { status: 500 }
    );
  }
}

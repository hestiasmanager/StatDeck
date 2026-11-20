import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  deckTitle: z.string().min(2),
  deckSubtitle: z.string().optional(),
  kpis: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        delta: z.string().optional(),
        sourceQuote: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  chartSummary: z.string().optional(),
  tone: z.enum(["founder", "analyst", "punchy"]).default("founder"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { deckTitle, deckSubtitle, kpis, chartSummary, tone } = parsed.data;

    const toneInstructions = {
      founder: `Tone: Thought leadership, builder perspective, strategic insight.
Voice: Direct, vulnerable yet authoritative, high agency. Avoid generic corporate buzzwords.`,
      analyst: `Tone: Rigorous, data-backed, institutional equity research depth.
Voice: Analytical, precise, focusing on unit economics, variance, and systemic indicators.`,
      punchy: `Tone: High-velocity viral LinkedIn hook, short punchy sentences, maximum whitespace.
Voice: Scroll-stopping, contrarian, single-line rhythm, designed for maximum saves and shares.`,
    }[tone];

    const kpiSummary = kpis
      .map((k) => `• ${k.label}: ${k.value}${k.delta ? ` (${k.delta})` : ""}${k.sourceQuote ? ` [Source: ${k.sourceQuote}]` : ""}`)
      .join("\n");

    const promptText = `
You are the world's highest-converting B2B LinkedIn creator, ghostwriting for top tech founders and venture partners.
Write a high-engagement LinkedIn carousel companion post based on the following presentation data.

${toneInstructions}

PRESENTATION TITLE: "${deckTitle}"
${deckSubtitle ? `SUBTITLE: "${deckSubtitle}"` : ""}

CORE METRICS & DATA:
${kpiSummary || "• Key strategic takeaways in attached carousel."}
${chartSummary ? `CHART INSIGHT: ${chartSummary}` : ""}

POST STRUCTURE (MUST FOLLOW EXACTLY):
1. HOOK: 1-2 lines that challenge conventional wisdom or state a surprising metric. Never start with "I'm excited to share" or "In today's fast-paced world".
2. THE TENSION / WHY THIS MATTERS: 2 short lines setting up the business reality.
3. THE 3-4 KEY DATA POINTS: Bullet points directly citing the numbers above with an actionable takeaway for each.
4. THE STRATEGIC LESSON: What smart leaders do with this information.
5. CLOSING CTA: A conversational question prompting comments, reminding them to swipe through the attached PDF carousel.
6. 3-4 relevant hashtags at the very bottom (#b2b #strategy #metrics etc.)

OUTPUT ONLY THE FINAL LINKEDIN POST TEXT. NO INTRODUCTORY REMARKS, NO CODE BLOCKS, NO EXPLANATIONS.
`;

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const geminiApiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    let postText = "";

    // 1. Try OpenRouter (gemini-4-hydrogen with fallback)
    if (openRouterApiKey) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://statdeck.ai",
            "X-Title": "StatDeck LinkedIn Writer",
          },
          body: JSON.stringify({
            models: [
              "google/gemini-4-hydrogen",
              "google/gemini-3.5-flash-lite",
              "google/gemini-2.5-flash",
            ],
            messages: [{ role: "user", content: promptText }],
            temperature: 0.7,
            reasoning: { effort: "low" },
            max_tokens: 1500,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (response.ok) {
          const data = await response.json();
          postText = data.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (err) {
        console.warn("OpenRouter caption generation failed, trying direct Gemini:", err);
      }
    }

    // 2. Direct Gemini Fallback if OpenRouter failed
    if (!postText && geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const data = await response.json();
          postText =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        }
      } catch (err) {
        console.warn("Direct Gemini caption generation failed:", err);
      }
    }

    // 3. Deterministic Heuristic Fallback if both LLMs are offline
    if (!postText) {
      const bulletList = kpis.length > 0
        ? kpis.map((k) => `👉 ${k.label}: ${k.value}${k.delta ? ` (${k.delta})` : ""}`).join("\n")
        : `👉 ${deckTitle}\n👉 ${deckSubtitle || "Data-driven operational review."}`;

      postText = `${deckTitle} — the numbers most operators miss.\n\n` +
        `When analyzing the latest data, one pattern becomes immediately clear: execution beats intuition every single time.\n\n` +
        `Here are the core takeaways from our latest benchmark:\n\n` +
        `${bulletList}\n\n` +
        `The difference between top performers and everyone else isn't budget—it's how fast they act on these metrics.\n\n` +
        `Full breakdown in the swipeable carousel attached below 👇\n\n` +
        `Which metric surprises you the most?\n\n` +
        `#strategy #business #data #leadership`;
    }

    return NextResponse.json({
      success: true,
      caption: postText,
      tone,
    });
  } catch (err) {
    console.error("Caption generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate caption" },
      { status: 500 }
    );
  }
}

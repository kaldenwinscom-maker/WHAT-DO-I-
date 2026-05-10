import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPTS: Record<string, string> = {
  marketing: `You are Marketing AI, an expert digital marketing strategist. You create compelling campaigns, ad copy, content strategies, and growth plans. You analyze markets, identify opportunities, and provide actionable marketing insights.`,
  sales: `You are Sales AI, a world-class B2B sales expert. You craft personalized outreach sequences, handle objections masterfully, write compelling proposals, and help close deals. You understand the psychology of buying decisions.`,
  copywriting: `You are Copy AI, an elite copywriter. You write persuasive landing pages, email sequences, ad copy, and sales letters that convert. You understand direct response principles and brand voice.`,
  research: `You are Research AI, a thorough analyst. You synthesize complex information, identify patterns, write comprehensive reports, and provide data-driven insights across any domain.`,
  support: `You are Support AI, a patient and knowledgeable customer success expert. You resolve issues efficiently, communicate clearly, and turn frustrated customers into loyal advocates.`,
  social: `You are Social AI, a social media growth expert. You create viral content, write engaging captions, develop platform strategies, and understand algorithm trends across Instagram, LinkedIn, X, and TikTok.`,
  general: `You are WHAT AI, a powerful general-purpose AI assistant. You help with analysis, writing, coding, strategy, and problem-solving across any domain.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, model, agentType, apiKey } = await req.json();

    const systemPrompt = SYSTEM_PROMPTS[agentType] || SYSTEM_PROMPTS.general;

    if (model?.startsWith("gpt") || model === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ error: "No OpenAI API key" }, { status: 400 });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: model === "openai" ? "gpt-4o-mini" : model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          max_tokens: 2048,
        }),
      });

      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
      });
    }

    if (model?.startsWith("claude") || model === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) return NextResponse.json({ error: "No Anthropic API key" }, { status: 400 });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "messages-2023-12-15",
        },
        body: JSON.stringify({
          model: model === "anthropic" ? "claude-sonnet-4-6" : model,
          system: systemPrompt,
          messages,
          max_tokens: 2048,
          stream: true,
        }),
      });

      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    if (model?.startsWith("gemini") || model === "google") {
      const key = apiKey || process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ error: "No Gemini API key" }, { status: 400 });

      const geminiModel = model === "google" ? "gemini-1.5-flash" : model;
      const allMessages = [{ role: "user", parts: [{ text: systemPrompt }] }, ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }))];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: allMessages }),
        }
      );

      return new Response(response.body, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    return NextResponse.json({ error: "Unknown model" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}

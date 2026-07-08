import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Model lists for each provider (static fallback)
const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
  ],
  anthropic: [
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
  ],
  google: [
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "gemma-7b-it",
  ],
  openrouter: [
    "meta-llama/llama-3.1-405b-instruct",
    "meta-llama/llama-3.1-70b-instruct",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-pro-1.5",
    "mistralai/mistral-large",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
  ],
  nvidia: [
    "meta/llama-3.1-8b-instruct",
    "meta/llama-3.1-70b-instruct",
    "meta/llama-3.1-405b-instruct",
    "nvidia/nemotron-4-340b-instruct",
  ],
};

interface ModelsResponse {
  success: boolean;
  models?: string[];
  error?: string;
}

/**
 * GET /api/models?provider=openai&apiKey=sk-xxx
 * Fetches available models for a provider using the provided API key.
 * Falls back to static list if key is invalid or API fails.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ModelsResponse>> {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const apiKey = searchParams.get("apiKey");

  if (!provider) {
    return NextResponse.json({ success: false, error: "Provider is required" }, { status: 400 });
  }

  // Return static list if no API key provided
  if (!apiKey || PROVIDER_MODELS[provider] === undefined) {
    return NextResponse.json({ 
      success: true, 
      models: PROVIDER_MODELS[provider] || [] 
    });
  }

  try {
    // Try to fetch live models from provider
    switch (provider) {
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          const models = data.data
            ?.filter((m: any) => m.id.includes("gpt"))
            .map((m: any) => m.id)
            .slice(0, 20);
          return NextResponse.json({ success: true, models: models || PROVIDER_MODELS.openai });
        }
        break;
      }
      case "anthropic": {
        // Anthropic doesn't have a public models endpoint, use static list
        return NextResponse.json({ success: true, models: PROVIDER_MODELS.anthropic });
      }
      case "google": {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (res.ok) {
          const data = await res.json();
          const models = data.models
            ?.filter((m: any) => m.name.includes("gemini"))
            .map((m: any) => m.name.replace("models/", ""))
            .slice(0, 20);
          return NextResponse.json({ success: true, models: models || PROVIDER_MODELS.google });
        }
        break;
      }
      case "groq": {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          const models = data.data?.map((m: any) => m.id).slice(0, 20);
          return NextResponse.json({ success: true, models: models || PROVIDER_MODELS.groq });
        }
        break;
      }
      case "openrouter": {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Return structured model info for the ModelPicker
          const models = data.data?.map((m: any) => ({
            id: m.id,
            name: m.name || m.id.split("/").pop() || m.id,
            provider: m.id.split("/")[0] || "other",
            context_length: m.context_length,
            pricing: m.pricing ? `$${(m.pricing.prompt * 1000000).toFixed(2)}/M` : undefined,
          })).slice(0, 100);
          return NextResponse.json({ success: true, models: models || PROVIDER_MODELS.openrouter });
        }
        break;
      }
      case "nvidia": {
        const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          const data = await res.json();
          const models = data.data?.map((m: any) => m.id).slice(0, 20);
          return NextResponse.json({ success: true, models: models || PROVIDER_MODELS.nvidia });
        }
        break;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch models for ${provider}:`, error);
  }

  // Fallback to static list
  return NextResponse.json({ success: true, models: PROVIDER_MODELS[provider] || [] });
}

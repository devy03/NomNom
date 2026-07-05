import { env, hasAI } from "@/lib/env";
import { generateAIResponse, type AIResponse } from "@/lib/aiEngine";
import type { Restaurant } from "@/types";

async function callOpenAI(message: string, restaurants: Restaurant[]): Promise<string> {
  const context = restaurants
    .slice(0, 5)
    .map((r) => `${r.name} (${r.cuisine}, ${"$".repeat(r.priceLevel)}, ${r.rating}★, ${r.distanceMiles ?? "?"} mi)`)
    .join("; ");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.aiApiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are NomNom, a friendly food-decision assistant. Reply in 1-2 warm, conversational sentences recommending from the given restaurant options. Never invent restaurants not in the list.",
        },
        { role: "user", content: `User said: "${message}". Nearby options: ${context}.` },
      ],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(message: string, restaurants: Restaurant[]): Promise<string> {
  const context = restaurants
    .slice(0, 5)
    .map((r) => `${r.name} (${r.cuisine}, ${"$".repeat(r.priceLevel)}, ${r.rating}★, ${r.distanceMiles ?? "?"} mi)`)
    .join("; ");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.aiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are NomNom, a friendly food-decision assistant. Reply in 1-2 warm, conversational sentences recommending from these nearby options: ${context}. User said: "${message}". Never invent restaurants not in the list.`,
              },
            ],
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

/** Generates a conversational recommendation. Always resolves — falls back to
 * the local rule-based engine if no AI key is configured or the request
 * fails, so the chat experience never breaks. */
export async function getAIRecommendation(message: string, pool: Restaurant[]): Promise<AIResponse> {
  const ruleBased = generateAIResponse(message, pool);
  if (!hasAI) return ruleBased;

  try {
    const text = env.aiProvider === "gemini"
      ? await callGemini(message, ruleBased.restaurants ?? pool)
      : await callOpenAI(message, ruleBased.restaurants ?? pool);
    return text ? { ...ruleBased, text } : ruleBased;
  } catch {
    return ruleBased;
  }
}

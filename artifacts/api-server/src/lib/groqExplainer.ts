import { logger } from "./logger";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface OutfitForExplanation {
  topName: string;
  topColor: string;
  bottomName: string;
  bottomColor: string;
  shoesName: string;
  shoesColor: string;
  jacketName?: string;
  jacketColor?: string;
  score: number;
}

export async function explainOutfit(outfit: OutfitForExplanation): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const jacketLine = outfit.jacketName
    ? `, a ${outfit.jacketColor} ${outfit.jacketName}`
    : "";

  const prompt = `You are a fashion stylist. In exactly 2 sentences, explain why this outfit works for someone with warm medium tan skin (hex: #CC9674), near-black eyes (#1F1919), and deep black hair (#0A0B0B). The outfit is: ${outfit.topColor} ${outfit.topName} with ${outfit.bottomColor} ${outfit.bottomName}, ${outfit.shoesColor} ${outfit.shoesName}${jacketLine}. Score: ${outfit.score}/100. Be specific about color interactions and skin tone contrast.`;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logger.error({ status: response.status, err }, "Groq API error");
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "Unable to generate explanation.";
}

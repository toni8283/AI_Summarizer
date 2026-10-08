import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SummarizeParams {
  title: string;
  url: string;
  text: string;
}

const SYSTEM_PROMPT = `You are a precision AI reading assistant. Your task is to summarize only the supplied webpage content.

Rules:
- Be concise, accurate, and objective.
- Capture the main point, central thesis, or primary purpose of the webpage.
- Include essential facts, figures, or conclusions.
- Never invent, assume, or extrapolate information that is not present in the scraped content.
- Avoid promotional fluff, cookie banners, navigation boilerplate, or repetitive phrasing.
- Format the output cleanly:
  1. Start with a direct, well-written overview paragraph (2 to 4 sentences).
  2. Follow with 3 to 5 clear bullet points highlighting key takeaways or notable details.
- Use plain text and markdown bullet points (- Item). Do not use excessive hashtags or markdown headers.`;

/**
 * Summarizes scraped webpage content using Google's Gemini API (free tier).
 */
export async function summarizeWithGemini(params: SummarizeParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const prompt = `Webpage Title: ${params.title}
Webpage URL: ${params.url}

Webpage Content:
"""
${params.text}
"""

Please provide a concise, accurate summary following the instructions.`;

  try {
    // Attempt with @google/generative-ai SDK using gemini-1.5-flash (fast, highly capable, free tier)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();

    if (!summaryText || summaryText.trim().length === 0) {
      throw new Error("EMPTY_GEMINI_RESPONSE");
    }

    return summaryText.trim();
  } catch (sdkError: unknown) {
    // Check if error is due to model name or SDK issue, try direct REST endpoint as fallback
    try {
      return await fallbackRestCall(apiKey, prompt);
    } catch {
      const errMsg = sdkError instanceof Error ? sdkError.message : String(sdkError);
      if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("invalid API key")) {
        throw new Error("INVALID_API_KEY");
      }
      if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      throw new Error("GEMINI_API_ERROR");
    }
  }
}

/**
 * Direct REST API fallback to ensure uninterrupted service with latest Gemini models.
 */
async function fallbackRestCall(apiKey: string, prompt: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 || message.includes("API key")) {
      throw new Error("INVALID_API_KEY");
    }
    if (res.status === 429) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    throw new Error(`REST_ERROR_${res.status}`);
  }

  const data = await res.json();
  const candidateText =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    throw new Error("EMPTY_REST_RESPONSE");
  }

  return candidateText.trim();
}


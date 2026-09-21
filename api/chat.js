import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing from Vercel Production environment variables."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
      config: {
        systemInstruction:
          "You are JARVIS, a concise and helpful browser assistant. Answer the user directly. Keep normal answers brief enough to be spoken aloud. Do not claim to have performed computer actions you cannot actually perform.",
        tools: [{ googleSearch: {} }]
      }
    });

    const answer = response.text?.trim();

    if (!answer) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Gemini request failed.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

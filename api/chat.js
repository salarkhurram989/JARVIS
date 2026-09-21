export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) return res.status(400).json({ error: "Message is required." });
    if (message.length > 4000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing from Vercel Production."
      });
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text:
                "You are JARVIS, a concise and helpful browser assistant. " +
                "Answer the user directly. Keep normal answers brief enough " +
                "to be spoken aloud. Do not claim to have performed computer " +
                "actions you cannot actually perform."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini HTTP error:", geminiResponse.status, data);

      const googleMessage =
        data?.error?.message || "Google Gemini returned an unknown error.";

      return res.status(502).json({
        error: "Gemini API error.",
        detail: googleMessage,
        googleStatus: data?.error?.status || null,
        googleCode: data?.error?.code || geminiResponse.status
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("JARVIS backend error:", error);

    return res.status(500).json({
      error: "Backend request failed.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

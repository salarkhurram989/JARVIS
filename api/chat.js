export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Message is required." });
    if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing from Vercel Production." });
    }

    // Try the newest Flash model first, then automatically fall back if Google
    // reports temporary capacity/high-demand errors.
    const models = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
    let lastError = null;

    for (const model of models) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
              }],
              generationConfig: {
                thinkingConfig: {
                  thinkingLevel: "low"
                },
                maxOutputTokens: 220
              }
            })
          }
        );

        const data = await geminiResponse.json();

        if (geminiResponse.ok) {
          const answer = data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

          if (answer) return res.status(200).json({ answer, model });
          lastError = new Error("Gemini returned an empty response.");
          continue;
        }

        const googleMessage =
          data?.error?.message || "Google Gemini returned an unknown error.";
        const status = data?.error?.status || "";
        lastError = new Error(`${model}: ${googleMessage}`);

        // 429/5xx and temporary capacity errors can be retried with another model.
        const temporary =
          geminiResponse.status === 429 ||
          geminiResponse.status >= 500 ||
          /high demand|overloaded|temporar|capacity|unavailable/i.test(googleMessage);

        if (temporary) continue;

        return res.status(502).json({
          error: "Gemini API error.",
          detail: googleMessage,
          googleStatus: status || null,
          googleCode: data?.error?.code || geminiResponse.status
        });
      } catch (error) {
        lastError = error;
      }
    }

    return res.status(503).json({
      error: "All Gemini models are temporarily unavailable.",
      detail: lastError?.message || "Google Gemini is currently at capacity.",
      triedModels: models
    });
  } catch (error) {
    console.error("JARVIS backend error:", error);
    return res.status(500).json({
      error: "Backend request failed.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'JARVIS Gemini backend' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > 4000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction:
          'You are JARVIS, a concise, helpful browser assistant. Answer the user directly. Keep normal answers brief enough to be spoken aloud. Do not claim to have performed computer actions you cannot actually perform.',
        tools: [{ googleSearch: {} }]
      }
    });

    const answer = response.text?.trim();

    if (!answer) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    res.json({ answer });
  } catch (error) {
    console.error('Gemini request failed:', error);

    const detail =
      error instanceof Error && error.message
        ? error.message.replace(/AIza[\w-]+/g, '[redacted]')
        : 'Unknown Gemini error';

    res.status(500).json({
      error: 'JARVIS could not reach Gemini right now.',
      detail
    });
  }
});

export default app;

if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`JARVIS Gemini backend listening on port ${port}`));
}

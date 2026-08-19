import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'JARVIS Gemini backend' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Message is required.' });
    if (message.length > 4000) return res.status(400).json({ error: 'Message is too long.' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });

    const interaction = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are JARVIS, a concise, helpful browser assistant. Answer the user's question directly. Keep normal answers brief enough to be spoken aloud. Do not claim to have performed computer actions you cannot actually perform.\n\nUser: ${message}`
            }
          ]
        }
      ],
      tools: [{ type: 'google_search' }]
    });

    res.json({ answer: interaction.output_text || 'I could not generate a response.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'JARVIS could not reach Gemini right now.' });
  }
});

export default app;

if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`JARVIS Gemini backend listening on port ${port}`));
}

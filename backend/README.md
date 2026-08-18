# JARVIS Gemini Backend

This Node.js/Express service keeps the Gemini API key off the public JARVIS frontend.

## Local setup

1. Install Node.js 18+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put your Gemini API key in `.env` as `GEMINI_API_KEY=...`.
5. Run `npm start`.
6. The API is available at `http://localhost:3000/api/chat`.

The frontend should POST JSON such as `{ "message": "What is a black hole?" }` and receive `{ "answer": "..." }`.

## Deployment

GitHub Pages can host the static frontend, but it does not run this Node.js server. Deploy the `backend` folder to a Node-compatible hosting service and set `GEMINI_API_KEY` there as a secret/environment variable. Then configure the JARVIS frontend to use that backend URL.

Never commit `.env` or the real Gemini API key. Google recommends environment variables for API keys. See https://ai.google.dev/gemini-api/docs/api-key

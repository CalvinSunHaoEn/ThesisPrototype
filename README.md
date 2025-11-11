# Mood Prism

Web-based, mobile-friendly prototype that turns an uploaded photo into an emotional snapshot using OpenAI's GPT-4o vision capabilities. Colors, micro-insights, and bar charts highlight the dominant vibes in English, making it simple to skim your state at a glance.

## Features
- Upload or drag a single photo, preview it, and clear the selection quickly.
- Securely paste your own OpenAI API key (never stored) and stream the image directly to OpenAI's Chat Completions endpoint.
- Structured prompt engineering forces the model to reply with JSON so the UI can render:
  - Dominant emotion chip + confidence percentage.
  - Color palette swatches that tint the results card.
  - Emotion spectrum bars (Joy, Calm, Focus, etc.).
  - Insight bullets and supportive micro-actions.
- Built-in fallback data so the UI can be demoed offline when the API call fails.

## Getting Started
1. Install project dependencies: none. It is a static bundle.
2. Open `index.html` in any modern browser (Chrome, Edge, Safari mobile).
3. Paste an `sk-...` API key into the field and toggle visibility if needed.
4. Upload (or drag and drop) a selfie or environment photo and press **Analyze emotion**.
5. The app converts the file into a temporary data URL and calls `https://api.openai.com/v1/chat/completions` (model `gpt-4o-mini`) with `response_format: json_object`.
6. Review the color palette, chart, and actionable insights that are rendered in English.

> **Note:** For production you should proxy the OpenAI request through your own backend and never expose an API key in client-side code.

## Tech Stack
- Plain HTML, CSS, and vanilla JavaScript for maximum portability.
- Fetch-based integration with `https://api.openai.com/v1/chat/completions` targeting `gpt-4o-mini`.
- No build tooling required; deploy straight to any static host (GitHub Pages, Netlify, Vercel).

## Extending
- Swap `FALLBACK_INSIGHTS` inside `app.js` with your own seeded dataset for demos.
- Persist API keys with `localStorage` if running in a trusted environment.
- Add a lightweight Node/Express proxy to mask the Authorization header before shipping to real users.

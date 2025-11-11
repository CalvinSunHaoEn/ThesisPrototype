# Emotion Mirror Prototype

A full-stack prototype that lets users upload text, photos, videos, or audio from iPhone Safari and receive instant emotional feedback powered by OpenAI.

## Features
- ✅ Express backend with endpoints for text and file-based emotion analysis.
- ✅ Multer-powered uploads ready for iPhone camera roll or microphone captures.
- ✅ Mobile-first single-page interface with responsive tabs and loading state.
- ✅ Visual emotion meter using canvas, color, and emoji feedback.

## Getting Started

1. Clone this repository into Replit or your preferred Node.js environment.
2. Create a `.env` file in the project root and add your OpenAI API key:

   ```bash
   echo "OPENAI_API_KEY=sk-your-key" > .env
   ```

3. Install dependencies and start the server:

   ```bash
   npm install
   npm run start
   ```

4. Open the hosted URL (e.g., `https://<repl-name>.<username>.repl.co`) in iPhone Safari. The UI is touch friendly and adapts to narrow screens.

## Environment Variables
- `OPENAI_API_KEY` – Secret key used to authenticate with the OpenAI Responses API.

## Project Structure

```
├── public/
│   ├── index.html      # Mobile-friendly UI
│   ├── style.css       # Responsive styling for iPhone Safari
│   └── app.js          # Fetch logic + canvas visualization
├── server.js           # Express server and OpenAI integration
├── package.json        # Dependencies and scripts
└── README.md           # Documentation
```

## Notes
- The prototype asks OpenAI to return structured JSON with an emotion label, intensity score, and brief summary.
- For media uploads we send the filename and optional description to OpenAI as a placeholder until direct media analysis is enabled.
- Customize the emotion-to-color/emoji mapping in `public/app.js` to expand the mood palette.

## License
Released under the ISC license. Feel free to remix for your own thesis or demo projects.

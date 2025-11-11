// server.js
// Express server providing endpoints for analyzing text and uploaded media with OpenAI's API.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Configure middleware for JSON parsing, URL encoded bodies, CORS, and static assets.
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer to keep uploads in memory. This is sufficient for forwarding to OpenAI later.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit which works for iPhone uploads.
});

// Initialize the OpenAI client using the API key from environment variables.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Helper that sends a structured prompt to OpenAI and normalizes the response.
 * @param {string} prompt - Prompt describing the user content to analyze.
 * @returns {Promise<{emotion: string, score: number, summary: string}>}
 */
async function analyzeEmotion(prompt) {
  try {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      response_format: { type: 'json_object' },
      temperature: 0.4
    });

    const outputText = response.output?.[0]?.content?.[0]?.text || '{}';
    const parsed = JSON.parse(outputText);

    return {
      emotion: parsed.emotion || 'calm',
      score: parsed.score || 5,
      summary: parsed.summary || 'We detected a calm, neutral tone.'
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error.message);
    // Fallback response if the OpenAI call fails or returns invalid JSON.
    return {
      emotion: 'calm',
      score: 5,
      summary: 'We had trouble analyzing the content, but it appears neutral.'
    };
  }
}

// Endpoint for text-based emotion analysis.
app.post('/analyze-text', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text content is required.' });
  }

  const prompt = `You are an empathetic assistant. Analyze the emotional tone of the following text and respond with JSON: {"emotion": "one-word emotion", "score": integer 1-10 representing intensity, "summary": "short supportive summary"}. Text: "${text.trim()}"`;

  const analysis = await analyzeEmotion(prompt);
  res.json(analysis);
});

// Endpoint for analyzing uploaded media such as photos, audio, or video.
app.post('/analyze-file', upload.single('media'), async (req, res) => {
  const { description, mediaType } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'A media file is required for analysis.' });
  }

  const fileName = file.originalname || 'uploaded-file';
  const humanReadableType = mediaType || file.mimetype || 'media';
  const extraDescription = description ? ` Additional context: ${description}` : '';

  const prompt = `You are an empathetic assistant. The user uploaded a ${humanReadableType} named "${fileName}". ${extraDescription} Describe the potential emotional tone conveyed by this kind of content. Respond with JSON: {"emotion": "one-word emotion", "score": integer 1-10 representing intensity, "summary": "short supportive summary"}.`;

  const analysis = await analyzeEmotion(prompt);
  res.json(analysis);
});

// Start the server.
app.listen(port, () => {
  console.log(`Emotion analysis server running on port ${port}`);
});

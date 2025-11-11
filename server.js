import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const apiKey = process.env.OPENAI_API_KEY;

let client = null;
if (apiKey) {
  client = new OpenAI({ apiKey });
} else {
  console.warn('OPENAI_API_KEY is not set. Emotion analysis will be unavailable.');
}

const responseSchema = {
  name: 'EmotionInsight',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      dominantEmotion: { type: 'string', description: 'Primary emotion observed from the person in the photo.' },
      confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence score for the dominant emotion.' },
      intensity: {
        type: 'object',
        additionalProperties: false,
        properties: {
          level: { type: 'string', description: 'Qualitative description (low, medium, high) of emotional intensity.' },
          score: { type: 'number', minimum: 0, maximum: 1, description: 'Quantitative intensity score between 0 and 1.' },
          description: { type: 'string', description: 'Short explanation of the intensity assessment.' }
        },
        required: ['level', 'score', 'description']
      },
      emotionalSpectrum: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            emotion: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 1 },
            description: { type: 'string' },
            color: { type: 'string', pattern: '^#?[0-9A-Fa-f]{6}$', description: 'Hex color associated with this emotion.' }
          },
          required: ['emotion', 'score', 'description', 'color']
        }
      },
      colorPalette: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            hex: { type: 'string', pattern: '^#?[0-9A-Fa-f]{6}$' },
            purpose: { type: 'string' }
          },
          required: ['name', 'hex', 'purpose']
        }
      },
      summary: { type: 'string', description: 'Concise description of the emotional reading.' },
      recommendations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Actionable wellbeing tips based on the emotional read.'
      }
    },
    required: ['dominantEmotion', 'confidence', 'intensity', 'emotionalSpectrum', 'colorPalette', 'summary']
  }
};

app.post('/api/analyze', async (req, res) => {
  const { imageBase64 } = req.body ?? {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64 payload.' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Server is not configured with an OpenAI API key.' });
  }

  try {
    const strippedImage = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const analysisPrompt = `You are an empathetic affective computing assistant. Analyze the person in the photo and infer their probable emotional state. Keep cultural sensitivity in mind and only use the visual cues in the image. Return a JSON object that matches the provided schema.`;

    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: analysisPrompt },
            { type: 'input_image', image_base64: strippedImage }
          ]
        }
      ],
      response_format: { type: 'json_schema', json_schema: responseSchema }
    });

    const rawOutput = response.output?.[0]?.content?.[0]?.text ?? response.output_text;

    if (!rawOutput) {
      return res.status(500).json({ error: 'Unable to parse analysis response.' });
    }

    const payload = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;

    return res.json(payload);
  } catch (error) {
    console.error('Emotion analysis failed:', error);
    return res.status(500).json({ error: 'Failed to analyze the photo.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Emotion analysis app listening on http://localhost:${PORT}`);
});


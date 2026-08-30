import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy-initialize Gemini client with required User-Agent header
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Endpoint: Ask Hamish the Tartan Owl / Word Tutor
  app.post('/api/ask-bard', async (req, res) => {
    try {
      const { prompt, mode, currentWord } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getGenAI();

      let systemInstruction = `You are 'Hamish the Tartan Owl', an enthusiastic, friendly, and wise Scottish vocabulary tutor designed for kids aged 10 to 15 studying in Scotland, UK.
You know all about Scottish culture, Scots language, regional Scottish slang (from Glasgow, Edinburgh, Dundee, Aberdeen/Doric, Highlands & Islands), British English, and academic vocabulary.
Your tone is fun, encouraging, educational, and kid-appropriate. Use gentle, authentic Scottish expressions like "Braw!", "Guid on ya!", "Keep up the grand work!", but keep explanations crystal clear and accessible.
Always provide definitions, at least two lively relatable examples (e.g. school life, sports, weather, Scottish adventures), synonyms, and antonyms where relevant.`;

      if (mode === 'story') {
        systemInstruction += `\nTask: Generate a lively, engaging 2-to-3 paragraph short adventure story for Scottish kids aged 10-15 incorporating the requested vocabulary words. Highlight the target words in **bold** and provide a mini glossary at the bottom.`;
      } else if (mode === 'translate') {
        systemInstruction += `\nTask: Provide the Scottish Scots/regional equivalent of the phrase or explain how a Scottish student would say it casually with friends or at school, with cultural context.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text || 'No response generated.' });
    } catch (error: any) {
      console.error('Gemini API error in /api/ask-bard:', error);
      res.status(500).json({
        error: error.message || 'Failed to get response from Hamish the Bard.',
      });
    }
  });

  // AI Endpoint: Generate Custom Word Challenge
  app.post('/api/generate-challenge', async (req, res) => {
    try {
      const { topic } = req.body;
      const ai = getGenAI();

      const prompt = `Generate a fun vocabulary puzzle for a Scottish student aged 10-15 about "${topic || 'Scottish Highlands and Mythical Creatures'}".
Return a JSON object with:
{
  "title": "Title of puzzle",
  "word": "Target Word (can be Scots or rich English)",
  "riddle": "A clever 2-line rhyming riddle clue",
  "definition": "Clear kid definition",
  "examples": ["Example 1 set in Scotland", "Example 2 in everyday life"],
  "synonyms": ["Synonym 1", "Synonym 2"],
  "antonyms": ["Antonym 1", "Antonym 2"],
  "funFact": "Cool historical or Scottish fact about the word"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error: any) {
      console.error('Challenge generation error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate challenge' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


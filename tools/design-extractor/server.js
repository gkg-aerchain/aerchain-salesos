import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Load the editable extraction prompt
function loadPrompt() {
  const promptPath = path.join(__dirname, 'prompts', 'extraction-prompt.md');
  return fs.readFileSync(promptPath, 'utf-8');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Determine media type from file extension/mimetype
function getMediaType(file) {
  const mime = file.mimetype;
  if (mime.startsWith('image/')) return mime;
  return null;
}

// Check if file is an image
function isImage(file) {
  return file.mimetype.startsWith('image/');
}

// Extract text content from non-image files
function extractTextContent(file) {
  const text = file.buffer.toString('utf-8');
  const ext = path.extname(file.originalname).toLowerCase();
  return { text, ext, filename: file.originalname };
}

// POST /api/extract — Main extraction endpoint
app.post('/api/extract', upload.array('files', 10), async (req, res) => {
  try {
    const textInput = req.body.text || '';
    const model = req.body.model || 'claude-sonnet-4-20250514';
    const files = req.files || [];

    if (!textInput && files.length === 0) {
      return res.status(400).json({ error: 'No input provided. Upload files or enter text.' });
    }

    // Build the message content array
    const content = [];

    // Add any uploaded images as vision content
    for (const file of files) {
      if (isImage(file)) {
        const base64 = file.buffer.toString('base64');
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: getMediaType(file),
            data: base64,
          }
        });
        content.push({
          type: 'text',
          text: `[Uploaded image: ${file.originalname}]`
        });
      } else {
        // Text-based files — include as text
        const { text, ext, filename } = extractTextContent(file);
        content.push({
          type: 'text',
          text: `--- File: ${filename} (${ext}) ---\n${text}\n--- End of ${filename} ---`
        });
      }
    }

    // Add the user's text input
    if (textInput) {
      content.push({
        type: 'text',
        text: `--- User Description ---\n${textInput}\n--- End Description ---`
      });
    }

    // Add the extraction instruction
    content.push({
      type: 'text',
      text: 'Analyze all the inputs above and extract a complete design system. Return ONLY the JSON object as specified in your system prompt.'
    });

    // Load the editable system prompt
    const systemPrompt = loadPrompt();

    // Call Claude API
    const response = await anthropic.messages.create({
      model,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    });

    // Extract the text response
    const responseText = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    // Try to parse as JSON
    let tokens;
    try {
      // Handle case where Claude wraps in code fences
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      tokens = JSON.parse(jsonStr);
    } catch (parseErr) {
      return res.status(500).json({
        error: 'Failed to parse Claude response as JSON',
        raw: responseText,
        parseError: parseErr.message,
      });
    }

    res.json({
      success: true,
      tokens,
      usage: response.usage,
      model: response.model,
    });

  } catch (err) {
    console.error('Extraction error:', err);
    res.status(500).json({
      error: err.message || 'Extraction failed',
      type: err.constructor.name,
    });
  }
});

// GET /api/prompt — Read current prompt (for preview/editing in UI)
app.get('/api/prompt', (req, res) => {
  try {
    const prompt = loadPrompt();
    res.json({ prompt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load prompt' });
  }
});

// PUT /api/prompt — Update prompt from UI
app.put('/api/prompt', express.text({ limit: '1mb' }), (req, res) => {
  try {
    const promptPath = path.join(__dirname, 'prompts', 'extraction-prompt.md');
    fs.writeFileSync(promptPath, req.body, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Design Extractor API running on http://localhost:${PORT}`);
  console.log(`Anthropic API key: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING'}`);
});

import OpenAI from 'openai';

// OpenRouter client configured for DeepSeek v3.1
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    'X-Title': 'AI Interview Platform',
  }
});

export default openai;

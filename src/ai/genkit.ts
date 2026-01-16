import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Use consolidated API key - GOOGLE_GENKIT_API_KEY
const apiKey = process.env.GOOGLE_GENKIT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.0-flash-exp', // Updated to latest model
});

import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

export async function generateWithOllama(prompt) {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  const { data } = await axios.post(url, { model: MODEL, prompt, stream: false }, { timeout: 120000 });
  // When stream:false, Ollama returns a JSON with 'response'
  return data.response || '';
}

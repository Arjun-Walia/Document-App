import Document from '../models/Document.js';
import { generateWithOllama } from '../services/ollama.js';

function buildPrompt(question, docs) {
  const context = docs
    .map((d, i) => `# Document ${i + 1}: ${d.originalName}\n` + d.chunks.slice(0, 10).map(c => c.text).join('\n---\n'))
    .join('\n\n');
  return `You are a helpful assistant. Answer the user's question using the provided document excerpts. Be concise and cite the document number when relevant.\n\nCONTEXT:\n${context}\n\nQUESTION: ${question}\n\nANSWER:`;
}

export const chat = async (req, res) => {
  try {
    const { question, documentIds } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    let docs;
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      docs = await Document.find({ _id: { $in: documentIds }, userId: req.user?.id || null });
    } else {
      docs = await Document.find({ userId: req.user?.id || null }).sort({ createdAt: -1 }).limit(3);
    }

    const prompt = buildPrompt(question, docs);
    const answer = await generateWithOllama(prompt);
    res.json({ answer });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

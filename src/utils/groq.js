const { Groq } = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3-32b';

// Build Groq messages array from history + user message
function buildMessages(message, history = []) {
  const system = {
    role: 'system',
    content:
      'You are a helpful tutor. Be concise, cite concepts when relevant, and keep examples practical.'
  };
  // Ensure history is array of {role, content}
  const normalized = Array.isArray(history)
    ? history
        .filter(m => m && m.role && m.content)
        .map(m => ({ role: m.role, content: String(m.content) }))
    : [];
  return [system, ...normalized, { role: 'user', content: String(message) }];
}

// Streaming chat via Groq SDK (returns async iterator)
async function streamCompletion({ message, history, temperature = 0.6 }) {
  const messages = buildMessages(message, history);
  const stream = await client.chat.completions.create({
    messages,
    model: DEFAULT_MODEL,
    temperature,
    max_completion_tokens: 4096,
    top_p: 0.95,
    stream: true,
    reasoning_effort: 'default',
    stop: null
  });
  return stream;
}

// Non-stream completion
async function completeOnce({ message, history, temperature = 0.6 }) {
  const messages = buildMessages(message, history);
  const resp = await client.chat.completions.create({
    messages,
    model: DEFAULT_MODEL,
    temperature,
    max_completion_tokens: 4096,
    top_p: 0.95,
    stream: false
  });
  const text = resp?.choices?.[0]?.message?.content || '';
  return text;
}

module.exports = { streamCompletion, completeOnce };

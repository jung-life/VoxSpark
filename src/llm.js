/**
 * LLM executor — thin wrapper around the Anthropic Messages API.
 * Reads ANTHROPIC_API_KEY from the environment (server-side) or from
 * window.__VOXSPARK_API_KEY (injected at runtime for the PWA).
 */

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * @typedef {Object} Message
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/**
 * @param {Message[]} messages
 * @param {Object} [opts]
 * @param {string} [opts.model]
 * @param {string} [opts.system]
 * @param {number} [opts.max_tokens]
 * @param {string} [opts.apiKey]
 * @returns {Promise<string>}
 */
export async function chat(messages, opts = {}) {
  const apiKey =
    opts.apiKey ||
    (typeof window !== 'undefined' && window.__VOXSPARK_API_KEY) ||
    (typeof process !== 'undefined' && process.env.ANTHROPIC_API_KEY);

  if (!apiKey) throw new Error('No Anthropic API key configured.');

  const body = {
    model: opts.model || DEFAULT_MODEL,
    max_tokens: opts.max_tokens || 1024,
    messages,
  };
  if (opts.system) body.system = opts.system;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

/**
 * Streaming variant — yields text deltas as they arrive.
 * @param {Message[]} messages
 * @param {Object} [opts]
 * @yields {string}
 */
export async function* chatStream(messages, opts = {}) {
  const apiKey =
    opts.apiKey ||
    (typeof window !== 'undefined' && window.__VOXSPARK_API_KEY) ||
    (typeof process !== 'undefined' && process.env.ANTHROPIC_API_KEY);

  if (!apiKey) throw new Error('No Anthropic API key configured.');

  const body = {
    model: opts.model || DEFAULT_MODEL,
    max_tokens: opts.max_tokens || 1024,
    stream: true,
    messages,
  };
  if (opts.system) body.system = opts.system;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === 'content_block_delta' && evt.delta?.text) {
          yield evt.delta.text;
        }
      } catch { /* skip malformed SSE lines */ }
    }
  }
}

#!/usr/bin/env node
/**
 * CI-side LLM executor for the ai-task GitHub Actions workflow.
 * Reads TASK from the environment, sends it to the Anthropic API,
 * and writes the response to ai-task-result.md.
 */

import { writeFileSync } from 'node:fs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TASK = process.env.TASK || '';

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set — add it as a repository secret.');
  process.exit(1);
}

if (!TASK.trim()) {
  console.error('TASK is empty.');
  process.exit(1);
}

const SYSTEM = `You are VoxSpark's CI assistant.
You receive a task description from a GitHub issue or comment and produce a clear,
actionable response. Be concise. Use markdown. If the task asks for code changes,
provide the diff or the updated file content with explanation.`;

async function run() {
  console.log(`Running AI task: ${TASK.slice(0, 120)}…`);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: 'user', content: TASK }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`API error ${res.status}: ${body}`);
    process.exit(1);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '_(empty response)_';

  writeFileSync('ai-task-result.md', text, 'utf8');
  console.log('Result written to ai-task-result.md');
  console.log(text);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

# VoxSpark

AI-powered voice task assistant — a Progressive Web App backed by Claude.

## Features

- **PWA** — installable, works offline, mobile-ready
- **Streaming chat** — token-by-token responses via the Anthropic Messages API
- **AI Task workflow** — label any GitHub issue `ai-task` (or comment `/ai <task>`) to have Claude respond automatically in CI
- **GitHub Pages deploy** — every push to `main` deploys the app instantly

## Quick Start

1. **Clone & open** — no build step needed; it's plain ES modules.
2. **Set your API key** at runtime:
   ```js
   window.__VOXSPARK_API_KEY = 'sk-ant-…';
   ```
   Or set `ANTHROPIC_API_KEY` as a repository secret for CI tasks.
3. Open `index.html` in a browser (or deploy to GitHub Pages).

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Push to `main` | Deploys the app to GitHub Pages |
| `ai-task.yml` | Issue labeled `ai-task`, comment `/ai <task>`, or manual dispatch | Runs the LLM executor and posts the response as a comment |

### Required Secrets

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Used by the `ai-task` runner in CI |

## Project Structure

```
VoxSpark/
├── index.html          # App shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (cache-first)
├── src/
│   ├── app.js          # UI logic & streaming chat
│   └── llm.js          # Anthropic API wrapper (chat + chatStream)
├── scripts/
│   ├── ai-task-runner.js  # CI LLM executor
│   └── gen-icons.js       # Dev utility: generate PNG icons
├── icons/              # App icons
└── .github/workflows/
    ├── deploy.yml      # GitHub Pages deployment
    └── ai-task.yml     # AI task automation
```

## License

MIT

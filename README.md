# VoxSpark

AI-powered voice task assistant — a Progressive Web App backed by Claude.

VoxSpark lets you chat with Claude directly from your browser, with no backend required. It's installable as a PWA (works offline), and includes a GitHub Actions workflow that lets Claude respond to GitHub issues and comments automatically in CI.

## Features

- **PWA** — installable on desktop and mobile, works offline via service worker
- **Streaming chat** — token-by-token responses via the Anthropic Messages API
- **Persistent API key** — enter your key once in the Settings panel; it's saved to `localStorage` and loaded automatically on every visit
- **AI Task workflow** — label any GitHub issue `ai-task` (or comment `/ai <task>`) to have Claude respond automatically in CI
- **GitHub Pages deploy** — every push to `main` deploys the app instantly

## Why is this useful?

- **No backend, no server costs** — the app calls the Anthropic API directly from the browser using your own key. Nothing is stored or proxied.
- **Installable** — add it to your home screen on mobile or install it as a desktop app. It behaves like a native app.
- **Offline capable** — the service worker caches the app shell so it loads even without a network connection.
- **AI in your GitHub workflow** — the `ai-task` Actions workflow means you can drop a task into a GitHub issue and get a Claude-generated response posted back as a comment, without leaving GitHub.

## Setup

### 1. Deploy to GitHub Pages

1. Go to **Settings → Pages** in your repository
2. Under **Source**, select **GitHub Actions**
3. Push or merge to `main` — the `deploy.yml` workflow publishes the app automatically
4. Your app will be live at `https://<your-username>.github.io/VoxSpark/`

### 2. Set your Anthropic API key in the app

The app needs your Anthropic API key to call Claude. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys).

Once the app is open:

1. Click the **⚙ gear icon** in the top-right corner of the header
2. Paste your API key (`sk-ant-…`) into the field
3. Click **Save**

The key is saved to your browser's `localStorage` — it persists across page reloads and PWA installs without you having to re-enter it. The status below the field shows `Key set (sk-ant-…)` to confirm it's active.

> The key never leaves your browser. It is sent directly to `api.anthropic.com` and is not stored on any server.

### 3. Set up the AI Task workflow (optional)

For the GitHub Actions AI task runner to work, add your Anthropic API key as a repository secret:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `ANTHROPIC_API_KEY`, Value: your key

Then trigger the workflow by:
- Labeling any issue with `ai-task`
- Commenting `/ai <your task>` on any issue
- Running the workflow manually from the **Actions** tab

Claude's response is posted back as a comment on the issue.

## GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy.yml` | Push to `main` | Deploys the app to GitHub Pages |
| `ai-task.yml` | Issue labeled `ai-task`, comment `/ai <task>`, or manual dispatch | Runs the LLM executor and posts the response as a comment |

### Required Secrets

| Secret | Where it's used |
|---|---|
| `ANTHROPIC_API_KEY` | `ai-task.yml` CI workflow — not needed for the PWA itself |

## Project Structure

```
VoxSpark/
├── index.html          # App shell + Settings dialog
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (cache-first offline support)
├── src/
│   ├── app.js          # UI logic, streaming chat, API key persistence
│   └── llm.js          # Anthropic API wrapper (chat + chatStream)
├── scripts/
│   ├── ai-task-runner.js  # CI LLM executor (writes ai-task-result.md)
│   └── gen-icons.js       # Dev utility: generate PNG icons via canvas
├── icons/              # App icons
└── .github/workflows/
    ├── deploy.yml      # GitHub Pages deployment
    └── ai-task.yml     # AI task automation
```

## Recent Changes

### Settings UI — API key persistence (`src/app.js`, `index.html`)

Previously the API key had to be set manually in the browser console each session:
```js
window.__VOXSPARK_API_KEY = 'sk-ant-…';
```

Now there is a **Settings panel** (gear icon in the header) where you can enter and save your key. It is stored in `localStorage` under `voxspark_api_key` and loaded automatically on every page load — no console commands needed. The dialog also shows a status indicator so you can confirm whether a key is currently active.

## License

MIT

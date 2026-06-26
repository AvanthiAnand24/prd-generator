# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A PRD (Product Requirements Document) generator: paste a rough idea, get a structured PRD back. Built as a React + Vite frontend and an Express backend, with Groq (llama-3.3-70b-versatile) for generation and Notion for export.

## Running the App

The frontend and backend must be started separately.

**Backend** (runs on port 3001):
```bash
node server.js
```

**Frontend** (runs on port 5173):
```bash
cd client && npm run dev
```

**Lint** (frontend only):
```bash
cd client && npm run lint
```

**Build** (frontend):
```bash
cd client && npm run build
```

`generate.js` is a standalone CLI script for testing Groq generation outside the server — run with `node generate.js`.

## Environment Variables

**Root `.env`** (used by `server.js`):
- `GROQ_API_KEY` — Groq API key
- `NOTION_TOKEN` — Notion integration token
- `NOTION_PAGE_ID` — ID of the Notion parent page where PRDs are created

**`client/.env`** (used by the Vite frontend):
- `VITE_API_URL` — Backend base URL (e.g. `http://localhost:3001`)

## Architecture

```
prd-generator/
├── server.js        # Express API — POST /generate, POST /export-notion, GET /
├── generate.js      # Standalone CLI script (Groq only, no server)
├── client/          # React + Vite frontend
│   └── src/
│       └── App.jsx  # Single-component UI; all state and fetch logic lives here
```

### Request flow

1. User types an idea → `App.jsx` POSTs to `/generate`
2. `server.js` sends the idea + system prompt to Groq; parses a `TITLE:` prefix line out of the response to extract the product name separately from the PRD body
3. Frontend renders the PRD via `react-markdown`
4. "Export to Notion" button POSTs to `/export-notion`; server converts markdown lines to Notion blocks (`heading_2` for `## …` lines, `paragraph` for everything else) and creates a child page under `NOTION_PAGE_ID`

### Key implementation detail

The Groq prompt instructs the model to output `TITLE: <name>` as the first line, then the PRD. `server.js` splits on `\n`, finds the `TITLE:` line, strips it, and returns `{ prd, title }` separately. The frontend keeps `title` and `prd` in separate state.

## Working Style Preferences

- This is a portfolio project for AI Product Manager / AI Product job applications — code quality and polish both matter, since it may be reviewed by interviewers
- Please explain changes in plain language as you make them, not just diffs
- Current priority: visual redesign of the UI (client/src/App.jsx, App.css) — it currently feels plain/default (center-aligned, default styling) and needs to look intentional and polished
- After redesign: add file upload support (.txt/.pdf) as an input method alongside pasted text
- Keep the existing free-tier stack (Groq, Notion, Vercel, Render) — no paid dependencies
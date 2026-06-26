# PRD Generator

**Turn a rough idea into a structured Product Requirements Document in seconds.**

Paste a thought, upload a doc, or speak into your mic — the AI returns a complete, 9-section PRD ready to share or push to Notion.

![Tech Stack](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=flat-square)
![Notion](https://img.shields.io/badge/Notion_API-000000?style=flat-square&logo=notion&logoColor=white)

---

## What it does

Product Managers spend hours translating rough ideas into structured specs. This tool cuts that to under 30 seconds.

| Input | Output |
|---|---|
| Raw idea, bullet points, voice memo | 9-section PRD: problem, users, requirements, edge cases, KPIs, open questions |
| Uploaded `.txt`, `.pdf`, or `.docx` | Structured doc, ready to review or edit |
| Direct microphone recording | Live transcription → PRD |
| Any of the above | One-click export to a Notion page |

---

## Features

**Three ways to input your idea**
- Type or paste free-form text directly
- Upload a document (`.txt`, `.pdf`, `.docx`) or audio file (`.mp3`, `.wav`, `.m4a`, and more)
- Record directly from the browser microphone — real-time transcription via the Web Speech API, no API key required

**AI generation via Groq + LLaMA 3.3 70B**
- Structured output with a consistent 9-section format
- Extracts a clean product name separately from the PRD body
- Whisper `large-v3-turbo` model handles audio file transcription

**Notion export**
- Converts the PRD markdown to Notion blocks (headings, paragraphs)
- Creates a child page under a configurable parent — no manual copy-paste

**Polished UI**
- Split-panel layout: input always visible alongside the generated PRD
- Inline onboarding so first-time users immediately understand the flow
- File badge, recording indicator, char counter, copy button, error states

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite | Fast HMR, minimal config |
| Styling | Vanilla CSS (custom design system) | Full control, no framework overhead |
| Backend | Express 5 (ES modules) | Thin API layer |
| LLM | Groq — `llama-3.3-70b-versatile` | Fastest inference on free tier |
| Speech-to-text | Groq — `whisper-large-v3-turbo` | Audio files; Web Speech API for mic |
| PDF | `pdf-parse` | Buffer-based extraction, no temp files |
| DOCX | `mammoth` | Raw text extraction |
| File upload | `multer` (memoryStorage) | Files never touch disk |
| Export | `@notionhq/client` | Official Notion SDK |
| Deploy | Vercel (frontend) + Render (backend) | Both on free tier |

---

## Architecture

```
Browser
  └─ React + Vite (port 5173)
        │  POST /extract   →  multer → pdf-parse / mammoth / Groq Whisper
        │  POST /generate  →  Groq LLaMA 3.3 70B → { prd, title }
        └─ POST /export-notion  →  @notionhq/client → Notion page URL

Express API (port 3001)
  └─ server.js  ·  all routes  ·  ES modules  ·  reads .env at startup
```

**Key implementation detail:** the Groq prompt instructs the model to output `TITLE: <name>` as the first line of its response. The server splits on `\n`, strips the title line, and returns `{ prd, title }` as separate fields. This lets the frontend render a large display title without it appearing inside the markdown body.

---

## Running locally

**Prerequisites:** Node 18+, a [Groq API key](https://console.groq.com) (free), a Notion integration token + page ID.

```bash
# 1. Clone
git clone https://github.com/AvanthiAnand24/prd-generator.git
cd prd-generator

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd client && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env          # fill in GROQ_API_KEY, NOTION_TOKEN, NOTION_PAGE_ID
echo "VITE_API_URL=http://localhost:3001" > client/.env

# 5. Start backend  (port 3001)
node server.js

# 6. Start frontend  (port 5173) — in a separate terminal
cd client && npm run dev
```

Open `http://localhost:5173`.

---

## Environment variables

**Root `.env`** (backend):

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) — free tier is sufficient |
| `NOTION_TOKEN` | Internal integration token from [notion.so/my-integrations](https://www.notion.so/my-integrations) |
| `NOTION_PAGE_ID` | ID of the Notion page where PRDs will be created as children |

**`client/.env`** (frontend):

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (`http://localhost:3001` locally, Render URL in prod) |

---

## Project structure

```
prd-generator/
├── server.js          # All API routes: /generate, /extract, /export-notion
├── generate.js        # Standalone CLI script for testing Groq outside the server
├── package.json       # Backend dependencies
└── client/
    ├── index.html     # Inter font via Google Fonts
    └── src/
        ├── App.jsx    # All state, handlers, and UI — single component
        └── App.css    # Custom design system: tokens, layout, components
```

---

## What's next

- **PRD history** — persist generated docs in localStorage so you can revisit them
- **Section-level regeneration** — click to re-run just one section without starting over
- **Export formats** — download as `.pdf` or `.docx` directly from the browser
- **Template modes** — switch between startup pitch, enterprise spec, or agile story format
- **Shareable links** — generate a read-only URL for a PRD to share with stakeholders

---

## About

Built as a portfolio project demonstrating AI product thinking applied to a real PM workflow bottleneck. The entire stack runs on free-tier services.

**Author:** [Avanthi Anand](https://github.com/AvanthiAnand24)

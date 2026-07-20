# Content Simplifier

Turn complex content into clear, plain-language explanations with real-world examples and analogies. Paste text, give a URL, or upload a file, and get an easy-to-understand explanation you can ask follow-up questions about and save to a searchable history.

Live app: https://content-simplified.onrender.com

## Overview

Content Simplifier is a React and Express web application. It uses the DeepSeek API to explain content in simple terms. It handles pasted text, web page URLs (fetched server-side), and file uploads (PDF, text, images via OCR, and spreadsheets). Explanations can be kept in a Postgres database as a searchable, bookmarkable history, or used in a session-only mode that saves nothing.

## Features

Content processing:
- Text simplification: paste any text and get a plain-language explanation with analogies.
- URL processing: paste a link and the server fetches the page, extracts its text, and explains it. Private and local addresses are blocked for safety.
- File uploads: PDF, text and markdown, images (read with OCR), and spreadsheets (Excel, CSV).
- Large content is truncated to stay within model limits (150k characters).

Organization and history:
- Category classification: AI, money, tech, business, other.
- Save to history: optionally store an explanation in the database.
- Search and filter history by text, category, bookmark, date range, and content type.
- Bookmark explanations for later.

Interactive:
- Context-aware follow-up questions about an explanation.
- Copy an explanation to the clipboard.
- Clear and start over.

## Technology stack

Frontend:
- React 18 with TypeScript, built with Vite.
- Tailwind CSS and shadcn/ui components.
- TanStack Query for data fetching, Wouter for routing.

Backend:
- Node.js with Express (TypeScript). One process serves the API and the built client.
- DeepSeek API (`deepseek-chat`) as the AI provider.
- Drizzle ORM over Neon serverless Postgres.
- Multer for uploads, Tesseract for image OCR, xlsx and csv-parser for spreadsheets.
- Zod for request validation.

Hosting:
- Render web service (the always-on server), Neon Postgres for storage. See `render.yaml`.

## Getting started (local)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` from the template and fill in the values:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: a Neon (or any Postgres) connection string.
   - `DEEPSEEK_API_KEY`: your DeepSeek API key.

3. Create the database tables:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5000`.

For a production build: `npm run build`, then `npm run start`.

## Trying it

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed test cases. A quick check against the live app:
- Paste a paragraph of text and read the explanation.
- Paste a public article URL and confirm the explanation reflects the real page.
- Upload a PDF or an image with text.
- Turn on save to history, then open the history page to see it.

## API endpoints

- `POST /api/simplify`: simplify pasted text or a URL. Saves to history when `saveToHistory` is true.
- `POST /api/upload`: upload and simplify a file.
- `POST /api/followup`: answer a follow-up question with the original explanation as context.
- `GET /api/explanations`: list saved history.
- `POST /api/explanations/search`: search and filter history.
- `POST /api/explanations/:id/bookmark`: toggle a bookmark.
- `DELETE /api/explanations/:id`: delete an explanation.

## Project structure

- `client/`: React frontend (Vite).
- `server/`: Express server, routes, storage, and services (`deepseek.ts` is the AI provider).
- `shared/`: Drizzle schema and shared types.
- `render.yaml`: Render deployment blueprint.

## Notes

- The server never sends AI or database credentials to the client. Secrets live only in environment variables.
- `server/services/claude.ts` is a dormant earlier Anthropic implementation, kept for reference and not used.

Last updated: July 20, 2026

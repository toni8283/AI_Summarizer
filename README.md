# AI Web Summarizer

A minimal, calm, and production-ready full-stack AI Web Summarizer built with Next.js, TypeScript, Tailwind CSS, Cheerio, and Google Gemini.

Extract clear, accurate, and concise summaries from any webpage in seconds.

---

## 1. Project Overview

**AI Web Summarizer** allows users to paste any webpage URL and instantly generate an objective, high-signal summary powered by Google Gemini. The interface is intentionally designed with an ultra-minimal aesthetic inspired by modern AI landing pages—featuring an ambient background grid, diffuse blue lighting, and a subtle flowing blue/purple gradient border during AI processing.

---

## 2. Features

- **Full-Stack Next.js (App Router)**: End-to-end type safety with TypeScript and server-side API routes.
- **Cheerio HTML Extraction**: Removes navigation, headers, footers, scripts, styles, advertisements, and cookie modals to extract pure readable content.
- **Google Gemini & Groq APIs (Free Tiers)**: Supports both Groq (`qwen/qwen3.8-27b`) for ultra-fast response and Google Gemini (`gemini-1.5-flash`) with automatic key detection.
- **Server-Side Security**: API keys are strictly confined to the server runtime and never exposed to the client browser.
- **Minimal, Calming UI**:
  - Full-screen soft light-blue/white background.
  - Subtle background grid with visible light-blue lines.
  - Soft, blurred ambient blue gradient blobs matching modern AI design.
  - Centered layout with generous whitespace.
  - Single rounded input container (28–30px border radius).
  - Smooth animated flowing gradient border (blue, light blue, soft purple) that travels around the input while processing.
- **Readable Summary Presentation**: Displays an overview paragraph followed by clean bullet points for key takeaways.
- **One-Click Copy**: Easily copy the generated summary to your clipboard.
- **Human-Friendly Error Handling**: Gracefully handles unreachable sites, paywalls, empty pages, timeouts, and API rate limits.
- **Fully Responsive**: Seamless layout adaptation across mobile, tablet, and desktop screens.

---

## 3. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Scraping**: [Cheerio](https://cheerio.js.org/)
- **AI Engines**: [Groq API](https://console.groq.com/) & [Google Gemini API](https://aistudio.google.com/) (`@google/generative-ai` / `gemini-1.5-flash`)

---

## 4. Project Structure

```text
ai-web-summarizer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── summarize/
│   │   │       └── route.ts       # POST /api/summarize endpoint
│   │   ├── globals.css            # Ambient lighting, subtle grid & flowing border animation
│   │   ├── layout.tsx             # Root layout and metadata
│   │   └── page.tsx               # Centered minimal UI, input, and summary result
│   └── lib/
│       ├── gemini.ts              # Gemini API integration & structured prompting
│       └── scraper.ts             # Cheerio scraping, clutter removal & text truncation
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules (protects .env, node_modules, etc.)
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies and scripts
├── postcss.config.mjs             # PostCSS configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Documentation
```

---

## 5. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.17.0 or later, Node 20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free Google Gemini API Key from Google AI Studio.

---

## 6. How to Get a Free Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the top navigation or sidebar.
4. Click **"Create API key"** (select an existing Google Cloud project or create a free default project).
5. Copy your generated API key.
   > **Note:** The Gemini 1.5 Flash model includes a generous free tier with 15 requests per minute (RPM) and 1,500 requests per day (RPD) at zero cost.

---

## 7. Environment Configuration

### Where to Create the File:
In the **root directory** of the project (at the same level as `package.json`), create a file named `.env.local`:

```bash
touch .env.local
```

### File Contents:
Add your Gemini API key inside `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **CRITICAL SECURITY NOTE**:
> The `GEMINI_API_KEY` is loaded strictly in server-side functions (`src/lib/gemini.ts` and `src/app/api/summarize/route.ts`).
> It is **never** prefixed with `NEXT_PUBLIC_` and is **never** bundled or transmitted to the client's browser.
> The `.gitignore` file is configured to exclude all `.env*` files, preventing accidental commits to GitHub.

---

## 8. Running the Application Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your GEMINI_API_KEY
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 9. API Documentation

### `POST /api/summarize`

Summarizes the readable text content of a given webpage.

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Body:
```json
{
  "url": "https://example.com/article"
}
```

#### Successful Response (`200 OK`):
```json
{
  "summary": "This article explores recent breakthroughs in quantum error correction...\n\n- Key finding 1\n- Key finding 2\n- Key finding 3",
  "title": "Quantum Error Correction Breakthrough",
  "url": "https://example.com/article"
}
```

#### Error Responses:
- `400 Bad Request`: Missing or invalid URL (`"Please enter a valid webpage URL."`).
- `404 Not Found`: Webpage does not exist.
- `422 Unprocessable Entity`: No readable text content found on the page.
- `502 Bad Gateway`: Unable to connect to host or access denied.
- `504 Gateway Timeout`: Webpage took longer than 12 seconds to respond.
- `500 Internal Server Error`: Server configuration or Gemini API issue.

---

## 10. How Web Scraping Works

Located in `src/lib/scraper.ts`:

1. **URL Validation**: Ensures the string is a valid HTTP or HTTPS protocol URI.
2. **Resilient Fetching**: Dispatches a fetch with standard browser headers and a 12-second abort timeout.
3. **Clutter Removal**: Cheerio strips non-content tags including:
   - `<script>`, `<style>`, `<noscript>`, `<iframe>`, `<svg>`
   - `<nav>`, `<header>`, `<footer>`, `<aside>`
   - Modals, cookie notices, social sharing widgets, and advertisement containers (`.ad`, `.advertisement`, `[role="banner"]`)
4. **Content Extraction**: Prioritizes semantic `<article>` and `<main>` tags. If unavailable or sparse, falls back to `<body>`.
5. **Whitespace Normalization**: Collapses extraneous tabs and repeated blank lines.
6. **Token Protection & Truncation**: Caps the extracted text at 14,000 characters to keep requests fast and prevent token overflow.

---

## 11. How the Gemini AI Integration Works

Located in `src/lib/gemini.ts`:

- Utilizes Google's **Gemini 1.5 Flash** model via the official `@google/generative-ai` SDK with an automatic REST API fallback.
- **Temperature**: Set to `0.2` for strict factual fidelity and minimal hallucination.
- **System Instructions**:
  - Focus strictly on content provided in the prompt.
  - Prohibit inventing or extrapolating unstated claims.
  - Structure output into a clear introductory overview followed by bullet points.
  - Restrict output length to ~800 tokens for clean readability.

---

## 12. Deployment to Vercel

This project is fully optimized for one-click deployment on [Vercel](https://vercel.com/):

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Web Summarizer"
   git remote add origin https://github.com/your-username/ai-web-summarizer.git
   git push -u origin main
   ```

2. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Under **"Environment Variables"**, add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key from Google AI Studio
5. Click **"Deploy"**.

Vercel will automatically build and deploy the Next.js application with zero additional configuration.

---

## 13. License

MIT License. Open source and free to use.


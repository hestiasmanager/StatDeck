# StatDeck

> **Brand-Locked Infographics, LinkedIn Carousels & Native PowerPoint Decks from Any URL, CSV, Excel, or PDF.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhestiasmanager%2FStatDeck)

StatDeck is a production-grade SaaS application designed to transform raw documents, live URLs, datasets, and unstructured prose into publication-ready visual assets—engineered for maximum architectural resilience and **near-zero operating costs**.

---

## Key Architectural Principles

1. **Zero AI Image Generation Costs:** Visuals, charts, and slides are rendered deterministically from a strict, Zod-validated JSON Abstract Syntax Tree (AST).
2. **Zero Server-Side Headless Browsers:** PDF, PNG, SVG, and `.pptx` generation occurs **100% client-side** in the user's browser, eliminating expensive Puppeteer/Playwright server infrastructure.
3. **Client-Side Document Parsing:** Uploaded CSV (`papaparse`), Excel (`xlsx`), and PDF (`pdfjs-dist`) files are parsed directly in the user's browser; only clean, compressed tabular markdown or text excerpts are transmitted.
4. **Single-Call Structured LLM Extraction:** Multi-gateway AI synthesis powered by the Vercel AI SDK (`generateObject`) supporting **OpenRouter**, **Google Gemini Flash**, and **OpenAI**, paired with an intelligent deterministic heuristic parser ($0.00 zero-token fallback).
5. **Content-Hash Caching & Sliding Rate Limits:** SHA-256 normalized caching in Upstash Redis (7-day TTL) ensures repeat extractions cost $0.00.

---

## 3 Synchronized Output Formats

Every extracted dataset maps dynamically to three synchronized viewports:

| Format | Native Dimensions | Target Platform | Exporter |
| :--- | :--- | :--- | :--- |
| **Vertical Infographic** | `800 × 2000` | Blog, Newsletter, Pinterest, Reddit | High-DPI PNG (`html-to-image`), Vector SVG |
| **LinkedIn Carousel** | `1080 × 1350` (4:5) | LinkedIn, Instagram Carousel | Multi-Page PDF (`jsPDF` + `html-to-image`), PNG |
| **Presentation Deck** | `16:9` Widescreen | Board meetings, client decks | Native Editable PowerPoint (`pptxgenjs`), SVG |

---

## Getting Started

### Prerequisites

- **Node.js:** v18.18+ or v20+ (v24 supported)
- **Package Manager:** `pnpm` (recommended), `npm`, or `yarn`

### 1. Clone the Repository

```bash
git clone https://github.com/hestiasmanager/StatDeck.git
cd StatDeck
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Configure Environment Variables

Copy the example environment template:

```bash
cp .env.example .env.local
```

Populate the keys in `.env.local`:

```env
# Public App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Gateway (Provide OpenRouter, Gemini, or OpenAI)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="google/gemini-3.8-flash"
GOOGLE_GENERATIVE_AI_API_KEY=""
GEMINI_MODEL="gemini-3.8-flash"
OPENAI_API_KEY=""

# Public REST API Key (for external automation & /api/v1/render-json)
STATDECK_API_KEY="your-secret-statdeck-api-key"

# Upstash Redis (Caching & Rate Limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Supabase / PostgreSQL Database
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Paddle Billing (Merchant of Record)
NEXT_PUBLIC_PADDLE_ENV="sandbox" # "sandbox" or "production"
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN="test_xxx"
PADDLE_API_KEY="pdl_api_xxx"
PADDLE_WEBHOOK_SECRET_KEY="pdl_wh_xxx"
PADDLE_CREATOR_PRICE_ID="pri_creator_xxx"
PADDLE_AGENCY_PRICE_ID="pri_agency_xxx"
```

> **Note:** If no AI API keys are configured, StatDeck automatically defaults to its built-in **Deterministic Heuristic Engine**, which profiles columns and statistical metrics for CSVs, Excel sheets, and URLs with $0.00 operating cost.

### 4. Database Migrations (Drizzle ORM)

StatDeck uses Drizzle ORM configured for PostgreSQL / Supabase with Row Level Security:

```bash
# Push schema directly to your database:
pnpm db:push

# Or generate and run migrations:
pnpm db:generate
pnpm db:migrate

# Launch Drizzle Studio to inspect database records:
pnpm db:studio
```

### 5. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
statdeck/
├── public/                 # Static assets, fonts, sample datasets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/
│   │   │   ├── brand-kit/  # Scrapes domain logo & brand colors
│   │   │   ├── extract/    # Structured LLM & heuristic synthesis
│   │   │   ├── extract-url/# Readability article cleaner
│   │   │   ├── mcp/        # Model Context Protocol endpoint
│   │   │   ├── v1/render-json # Google Slides add-on ready REST API
│   │   │   └── webhooks/paddle# Webhook handler with idempotency
│   │   ├── tools/[slug]/   # 25+ Programmatic SEO workflow landing pages
│   │   ├── globals.css     # Tailwind styling & editorial font tokens
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Zero-friction homepage & interactive studio
│   ├── components/
│   │   ├── blocks/         # Comparison tables, steps, quotes, pros/cons
│   │   ├── canvas/         # Infographic, Carousel, & Presentation renderers
│   │   ├── charts/         # SVG Bar, Donut, Horizontal Bar, & Line charts
│   │   └── studio/         # WYSIWYG studio, Zoom toolbar, Exporter modal
│   └── lib/
│       ├── ai/             # Prompts, OpenRouter/Gemini gateway, heuristic parser
│       ├── brand/          # WCAG AA contrast normalization & color tools
│       ├── cache/          # Upstash Redis client, SHA-256 hashing, rate-limiter
│       ├── db/             # Drizzle PostgreSQL schema & migrations
│       ├── exporters/      # Client-side PPTX, PDF Carousel, PNG, & SVG exporters
│       ├── paddle/         # Paddle billing client & idempotency engine
│       ├── parsers/        # Client-side CSV, Excel, PDF, & URL parsers
│       ├── pseo/           # Programmatic SEO workflow registry
│       ├── schemas/        # Zod DeckSchema AST & BrandKit validation
│       └── themes/         # 12 Editorial theme CSS custom-property definitions
├── drizzle.config.ts       # Drizzle Kit configuration
├── next.config.ts          # Next.js build configuration
├── tailwind.config.ts      # Tailwind theme extensions
└── tsconfig.json           # TypeScript configuration
```

---

## Verification & Testing

Run the test suite and typechecks:

```bash
# Strict TypeScript Typecheck
pnpm typecheck

# Production Next.js Build
pnpm build
```

---

## License

Private & Proprietary. All rights reserved.

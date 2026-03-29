# Kanbi

> AI-powered Kanban board that extracts tasks from notes, PDFs & URLs in seconds.

[![Next.js](https://img.shields.io/badge/Next.js-latest-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live:** [kanbi.vercel.app](https://kanbi.vercel.app/) &nbsp;·&nbsp; **Author:** [Muhammad Tanveer Abbas](https://themvpguy.vercel.app/)

---

## What is Kanbi?

Kanbi turns messy notes, emails, PDFs, and URLs into a clean Kanban board in under 2 seconds using Groq AI. It includes workload analysis, burnout detection, an AI productivity coach, and a full SaaS billing layer kanbi all in one Next.js app.

---

## Features

**AI**
- Task extraction from text, emails, PDFs, and URLs via Groq (llama-3.3-70b) in ~2 seconds
- Workload health scoring, burnout risk detection, and deadline clustering
- Conversational AI productivity coach with full board context
- Morning briefings, auto-scheduling, and intelligent task adjustments (Autopilot)

**Task Management**
- Drag-and-drop Kanban board (To Do / In Progress / Done)
- Priority system (Urgent / High / Medium / Low) with color coding
- Custom tags, time estimates, and due dates
- Board templates (Daily, Sprint, Meeting, Project, Quick Start)
- Save, search, and manage multiple boards

**Analytics**
- Real-time dashboard with task stats and activity charts
- Workload snapshots and AI insight feed
- Daily/weekly goal tracking

**Platform**
- Stripe subscriptions (Free / Premium at $9/month)
- Google Calendar integration (OAuth 2.0, sync tasks with due dates)
- Export boards as DOCX or PDF
- Dark/light mode with system detection
- Keyboard shortcuts, onboarding tour, responsive design
- Row Level Security on all database tables

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (SSR) |
| AI | Groq SDK (llama-3.3-70b-versatile) |
| Payments | Stripe |
| UI | Radix UI + ShadCN |
| Animation | Framer Motion |
| Charts | Recharts |
| Export | docx, jspdf |
| Validation | Zod |
| Testing | Vitest, Playwright |

---

## Getting Started

```bash
git clone https://github.com/MuhammadTanveerAbbas/kanbi.git
cd kanbi
pnpm install
cp .env.example .env.local
# Fill in .env.local with your credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `GROQ_API_KEY` | Yes | Groq API key kanbi [console.groq.com](https://console.groq.com/keys) |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Yes | Stripe price ID for the premium plan |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL (e.g. `https://kanbi.vercel.app`) |
| `NEXT_PUBLIC_USE_AI` | Yes | Set to `true` to enable AI features |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (required for Calendar integration) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret (required for Calendar integration) |

---

## Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run `supabase/schema.sql`
3. Copy the project URL and keys into `.env.local`

---

## Folder Structure

```
kanbi/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Sign-in, sign-up, forgot, reset-password pages
│   │   ├── api/
│   │   │   ├── ai/          # Chat, workload analysis, completion tracking
│   │   │   ├── autopilot/   # Morning briefings, schedule, settings
│   │   │   ├── boards/      # Board CRUD and export
│   │   │   ├── parse-pdf/   # PDF task extraction
│   │   │   ├── parse-url/   # URL task extraction
│   │   │   ├── extract/     # Text task extraction
│   │   │   ├── saved/       # Saved board management
│   │   │   ├── stripe/      # Checkout and customer portal
│   │   │   ├── webhooks/    # Stripe webhook handler
│   │   │   └── ...          # profile, analytics, usage, feedback, health
│   │   └── dashboard/       # Board, chat, autopilot, saved, settings pages
│   ├── components/
│   │   ├── ai/              # Task generator component
│   │   ├── auth/            # Auth forms
│   │   ├── landing/         # Landing page sections
│   │   └── ui/              # ShadCN UI primitives
│   ├── hooks/               # useTasksStore, useAuth
│   └── lib/
│       ├── ai/              # WorkloadAnalyzer, ChatAssistant, AutopilotEngine
│       ├── errors/          # Typed error classes
│       ├── export/          # DOCX and PDF exporters
│       ├── services/        # UsageService, BoardService, CachingService
│       ├── supabase/        # Client, server, and middleware helpers
│       └── validation/      # Zod schemas
├── supabase/
│   └── schema.sql           # Full database schema
├── e2e/                     # Playwright end-to-end tests
├── .env.example             # Environment variable template
└── next.config.ts           # Next.js config with security headers
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/extract` | POST | Extract tasks from text via Groq AI |
| `/api/parse-pdf` | POST | Extract tasks from PDF upload |
| `/api/parse-url` | POST | Extract tasks from a web page URL |
| `/api/parse-tasks` | POST | Parse tasks from raw notes |
| `/api/boards` | GET/POST | List or create boards |
| `/api/boards/[id]` | GET/PATCH/DELETE | Manage a specific board |
| `/api/boards/[id]/export` | POST | Export board as PDF or DOCX |
| `/api/boards/save` | POST | Save board to database |
| `/api/saved` | GET | List saved boards |
| `/api/saved/[id]` | GET/PATCH/DELETE | Manage a saved board |
| `/api/ai/chat` | POST | AI chat with board context |
| `/api/ai/analyze-workload` | POST | Workload health analysis |
| `/api/ai/status` | GET | AI service status |
| `/api/ai/track-completion` | POST | Track task completions for AI learning |
| `/api/autopilot` | POST | Generate autopilot briefing (legacy) |
| `/api/autopilot/briefing` | POST | Generate morning briefing |
| `/api/autopilot/settings` | GET/POST | Get or update autopilot settings |
| `/api/integrations/google-calendar/auth` | GET | Start Google Calendar OAuth flow |
| `/api/integrations/google-calendar/callback` | GET | OAuth callback handler |
| `/api/integrations/google-calendar/status` | GET | Check connection status |
| `/api/integrations/google-calendar/sync` | POST | Sync tasks with due dates to calendar |
| `/api/integrations/google-calendar/disconnect` | POST | Disconnect Google Calendar |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Open Stripe billing portal |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/subscription/status` | GET | Get subscription status |
| `/api/analytics` | GET | Get analytics data |
| `/api/usage` | GET | Get AI/board usage stats |
| `/api/task-stats` | GET | Task statistics |
| `/api/task-activity` | GET | Activity feed |
| `/api/sync-task-stats` | POST | Sync task stats to DB |
| `/api/profile` | GET/PATCH/DELETE | User profile management |
| `/api/feedback` | POST | Submit feedback |
| `/api/health` | GET | Health check |

---

## Scripts

```bash
pnpm dev            # Start development server
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # ESLint
pnpm test           # Unit tests (single run)
pnpm test:watch     # Unit tests in watch mode
pnpm test:coverage  # Coverage report
pnpm test:e2e       # Playwright E2E tests
```

---

## Deployment

Recommended: [Vercel](https://vercel.com)

1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables
4. Deploy

For production, update:
- `NEXT_PUBLIC_APP_URL` → your domain
- `STRIPE_WEBHOOK_SECRET` → production webhook secret from Stripe dashboard

---

## Usage Limits

| | Free | Premium ($9/mo) |
|---|---|---|
| AI extractions/day | 10 | 50 |
| AI extractions/month | 300 | 1,500 |
| Board saves/day | 10 | 50 |
| Board saves/month | 300 | 1,500 |
| AI Chat + Autopilot | ✓ | ✓ |
| PDF import | ✓ | ✓ |
| DOCX & PDF export | ✓ | ✓ |
| Google Calendar sync | ✓ | ✓ |

---

## License

MIT kanbi see [LICENSE](LICENSE)

---

Built by [Muhammad Tanveer Abbas](https://themvpguy.vercel.app/)

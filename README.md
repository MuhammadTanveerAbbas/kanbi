# KANBI

AI powered Task Management SaaS Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

Transform messy notes into organized Kanban boards using AI in 10 seconds. Complete SaaS platform with AI workload management, burnout prevention, productivity coaching, Notion integration, and professional export options (DOCX, PDF).

## Features

### Core Features

- **AI Task Extraction** - Groq AI parses notes and extracts tasks (saves 2 hours/day)
- **AI Workload Management** - Smart health scores, time estimates, and burnout prevention
- **AI Chat Assistant** - Talk to an AI productivity coach about your tasks
- **AI Pattern Learning** - Learns your productivity habits and suggests optimal scheduling
- **Kanban Board** - Drag and drop task management with priorities
- **Notion Integration** - Two-way sync with Notion databases
- **Export Options** - Save boards as DOCX or PDF with professional formatting
- **Authentication** - Supabase Auth with email/password
- **Cloud Storage** - PostgreSQL database for secure storage
- **Stripe Payments** - Premium subscriptions ($9/month)
- **Analytics Dashboard** - Usage stats and activity tracking
- **Responsive** - Works on desktop, tablet, and mobile

### Dashboard Features

- **AI Workload Health** - Real-time health score and overload detection (prevents burnout)
- **AI Insights Panel** - Smart suggestions based on your work patterns
- **AI Chat Assistant** - Conversational AI that helps you plan and prioritize
- **Pattern Learning** - AI learns your productivity habits over time
- **Notion Integration** - Seamless two-way sync with Notion
- **Professional Export** - Export to DOCX or PDF with formatting
- **Goal Setting** - Set and track daily/weekly task goals
- **Task Statistics** - Priority distribution and completion rate charts
- **Recent Boards** - Quick access to last 5 boards
- **Activity Feed** - Real-time timeline of all actions
- **Keyboard Shortcuts** - Power user efficiency (Press `?`)
- **Dark/Light Mode** - Theme toggle with persistence
- **Onboarding Tour** - Guided introduction for new users
- **Board Templates** - 5 pre-built workflows (Daily, Sprint, Meeting, Project, Quick Start)
- **Favorites** - Star important boards for quick access
- **Search** - Find boards instantly

## Quick Start

```bash
git clone https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard.git
cd kanbi-ActionBoard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### 1. Supabase (Required)

1. Create a project at [Supabase](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/migration-integrations.sql` for integrations support
4. Get credentials from Settings → API
5. Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. AI Keys (Required)

**Groq (Required)**

```bash
GROQ_API_KEY=your_groq_api_key
```

Get from: https://console.groq.com/keys

### 3. Stripe (Optional)

```bash
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_ID=your_price_id
```

### 4. Notion Integration (Required)

```bash
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/api/integrations/notion/callback
```

Get from [Notion Developers](https://developers.notion.com) → My Integrations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Groq (llama-3.3-70b-versatile)
- **Payments**: Stripe
- **UI**: ShadCN UI
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Export**: docx, jspdf
- **Integration**: Notion SDK

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx           # Overview with stats & analytics
│   │   ├── board/page.tsx     # Kanban board with templates
│   │   ├── saved/page.tsx     # Saved boards management
│   │   ├── settings/page.tsx  # User settings & billing
│   │   └── layout.tsx         # Dashboard layout with nav
│   ├── (auth)/
│   │   ├── login/             # Login page
│   │   └── sign-up/           # Signup page
│   ├── pricing/               # Pricing page
│   ├── api/                   # API routes
│   └── page.tsx               # Landing page
├── components/
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── search-bar.tsx
│   │   ├── board-templates.tsx
│   │   ├── keyboard-shortcuts.tsx
│   │   ├── recent-boards.tsx
│   │   ├── onboarding-tour.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── task-statistics.tsx
│   │   ├── goal-setting.tsx
│   │   ├── activity-feed.tsx
│   │   ├── skeleton.tsx
│   │   └── empty-state.tsx
│   ├── landing/               # Landing page sections
│   ├── board/                 # Board components
│   └── ui/                    # ShadCN UI components
└── lib/
    ├── supabase/              # Supabase client & auth
    ├── stripe/                # Stripe configuration
    └── dashboard-types.ts     # TypeScript types
```

## Keyboard Shortcuts

Press `?` anywhere to see all shortcuts:

- `Ctrl/⌘ + K` - Open search
- `Ctrl/⌘ + N` - New board
- `Ctrl/⌘ + S` - Save board
- `Ctrl/⌘ + E` - Export board
- `?` - Show shortcuts panel

## Database Schema

The app uses these main tables:

- `profiles` - User profiles
- `subscriptions` - Stripe subscriptions
- `usage_tracking` - Daily usage limits
- `saved_generations` - Saved boards with favorites
- `board_tags` - Task labels/tags
- `task_stats` - Analytics data
- `task_completions` - AI learning data (tracks completed tasks)
- `ai_insights` - AI-generated suggestions
- `workload_snapshots` - Daily workload analytics
- `integrations` - Notion OAuth tokens and sync status
- `autopilot_settings` - AI autopilot configuration
- `morning_briefings` - Daily AI briefings
- `auto_schedule` - AI-scheduled tasks
- `autopilot_adjustments` - AI adjustment logs
- `chat_messages` - AI chat history

Run SQL file:

1. `supabase/schema.sql` - Complete schema (✅ Already includes all features)

## Usage

### Create a Board

1. Go to Dashboard → Board
2. Click "Use Template" or start from scratch
3. Paste your notes
4. AI extracts tasks automatically
5. Drag & drop to organize
6. Save to cloud

### Track Progress

1. Set daily/weekly goals in Dashboard
2. View task statistics and charts
3. Check activity feed for history
4. Monitor completion rates

### Manage Boards

1. Access recent boards from Dashboard
2. Star favorites for quick access
3. Search all saved boards
4. Export as DOCX or PDF

### Sync with Notion

1. Go to Settings → Integrations
2. Click "Connect Notion"
3. Authorize the app
4. Tasks auto-sync bidirectionally

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Setup

1. Create Supabase project
2. Run `supabase/schema.sql`
3. Run `supabase/ai-features.sql`
4. Run `supabase/notion-integration.sql`
5. Enable Row Level Security

### Stripe Setup

1. Create Stripe account
2. Add webhook endpoint: `your-domain.com/api/webhooks/stripe`
3. Copy webhook secret
4. Add to environment variables

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing documentation
- Review code comments

---

**Star this repo if you find it useful!**

Made with love by [Muhammad Tanveer Abbas](https://github.com/MuhammadTanveerAbbas)

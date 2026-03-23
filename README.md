# KANBI

AI powered Task Management SaaS Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

Transform messy notes into organized Kanban boards using AI in 10 seconds. Complete SaaS platform with AI workload management, burnout prevention, productivity coaching, Google Calendar sync, Notion integration, and professional export options (DOCX, PDF).

## ✨ Features

### 🤖 AI-Powered Features

- **AI Task Extraction** - Groq AI (llama-3.3-70b) parses notes and extracts tasks in under 2 seconds
- **AI Workload Management** - Real-time health scores, time estimates, and burnout prevention
- **AI Chat Assistant** - Conversational AI productivity coach with full board context
- **AI Pattern Learning** - Learns your productivity habits and suggests optimal scheduling
- **AI Autopilot** - Morning briefings, auto-scheduling, and intelligent task adjustments
- **Burnout Prevention** - AI monitors workload and provides relief suggestions

### 📋 Task Management

- **Kanban Board** - Drag and drop task management with 4 columns (To Do, In Progress, Done, Blocked)
- **Board Templates** - 5 pre-built workflows (Daily, Sprint, Meeting, Project, Quick Start)
- **Priority System** - Urgent, High, Medium, Low with color coding
- **Task Labels** - Custom tags with colors
- **Time Estimates** - AI-generated duration estimates
- **Favorites** - Star important boards for quick access
- **Search** - Find boards instantly

### 🔗 Integrations

- **Google Calendar** - Per-task reminders or bulk "Set All Reminders" with one click
- **Notion** - Two-way OAuth sync with Notion databases
- **PDF Import** - Extract tasks from PDF documents
- **Email Import** - Parse tasks from email threads

### 📊 Analytics & Insights

- **Dashboard Overview** - Real-time stats, health score, and activity charts
- **Task Statistics** - Priority distribution and completion rate charts
- **Goal Setting** - Set and track daily/weekly task goals
- **Activity Feed** - Real-time timeline of all actions
- **Workload Snapshots** - Daily workload analytics and trends
- **AI Insights Panel** - Smart suggestions based on your work patterns

### 💼 Professional Features

- **Export Options** - Save boards as DOCX or PDF with professional formatting
- **Stripe Payments** - Premium subscriptions ($9/month)
- **Usage Tracking** - Monitor AI usage and board limits
- **Keyboard Shortcuts** - Power user efficiency (Press `?`)
- **Dark/Light Mode** - Theme toggle with system detection
- **Onboarding Tour** - Guided introduction for new users
- **Responsive Design** - Works on desktop, tablet, and mobile

### 🔐 Security & Auth

- **Supabase Auth** - Email/password authentication with email verification
- **Row Level Security** - Database-level security policies
- **OAuth Integration** - Secure Google and Notion OAuth flows
- **Session Management** - Secure cookie-based sessions

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/MuhammadTanveerAbbas/kanbi.git
cd kanbi

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3.4 |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (SSR) |
| **AI** | Groq SDK (llama-3.3-70b-versatile) |
| **Payments** | Stripe |
| **UI Components** | Radix UI + ShadCN UI |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Export** | docx, jspdf |
| **Integrations** | Notion SDK, Google APIs |
| **Testing** | Vitest, Playwright |

## 🔧 Environment Setup

### 1. Supabase (Required)

1. Create a project at [Supabase](https://supabase.com)
2. Go to SQL Editor
3. Run `supabase/schema.sql` (complete unified schema)
4. Get credentials from Settings → API
5. Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Groq AI (Required)

1. Sign up at [Groq Console](https://console.groq.com)
2. Create API key
3. Add to `.env.local`:

```bash
GROQ_API_KEY=your_groq_api_key
```

### 3. Stripe (Required for Payments)

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from Dashboard
3. Create a product and price
4. Add webhook endpoint: `your-domain.com/api/webhooks/stripe`
5. Add to `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_ID=price_your_id
```

### 4. Google Calendar (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project and enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3000/api/google/callback`
5. Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback
```

### 5. Notion Integration (Optional)

1. Go to [Notion Developers](https://developers.notion.com)
2. Create new integration
3. Add redirect URI: `http://localhost:3000/api/integrations/notion/callback`
4. Add to `.env.local`:

```bash
NOTION_CLIENT_ID=your_client_id
NOTION_CLIENT_SECRET=your_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/api/integrations/notion/callback
```

## 📁 Project Structure

```
kanbi/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth pages (sign-in, sign-up, forgot, reset)
│   │   ├── api/                 # API routes
│   │   │   ├── ai/              # AI endpoints (chat, workload, completions)
│   │   │   ├── autopilot/       # Autopilot features
│   │   │   ├── google/          # Google Calendar integration
│   │   │   ├── integrations/    # Notion integration
│   │   │   ├── stripe/          # Stripe checkout & portal
│   │   │   └── webhooks/        # Stripe webhooks
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── page.tsx         # Overview with stats
│   │   │   ├── board/           # Kanban board
│   │   │   ├── chat/            # AI chat assistant
│   │   │   ├── autopilot/       # Autopilot features
│   │   │   ├── saved/           # Saved boards
│   │   │   └── settings/        # User settings
│   │   ├── pricing/             # Pricing page
│   │   ├── icon.tsx             # Favicon
│   │   ├── apple-icon.tsx       # Apple touch icon
│   │   ├── opengraph-image.tsx  # OG image
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── auth/                # Auth components
│   │   ├── board/               # Board components
│   │   ├── dashboard/           # Dashboard components
│   │   ├── landing/             # Landing page sections
│   │   └── ui/                  # ShadCN UI components
│   ├── lib/
│   │   ├── ai/                  # AI service utilities
│   │   ├── supabase/            # Supabase client & middleware
│   │   ├── integrations/        # Integration utilities
│   │   └── export/              # Export utilities
│   └── proxy.ts                 # Next.js 16 middleware
├── supabase/
│   └── schema.sql               # Complete database schema
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## ⌨️ Keyboard Shortcuts

Press `?` anywhere to see all shortcuts:

- `Ctrl/⌘ + K` - Open search
- `Ctrl/⌘ + N` - New board
- `Ctrl/⌘ + S` - Save board
- `Ctrl/⌘ + E` - Export board
- `?` - Show shortcuts panel

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profiles with onboarding status
- `subscriptions` - Stripe subscription management
- `usage_tracking` - Daily usage limits (generations, boards, AI)
- `saved_generations` - Saved boards with favorites and categories
- `board_tags` - Custom task labels with colors
- `task_stats` - Daily task statistics

### AI Tables
- `task_completions` - AI learning data (tracks completed tasks)
- `ai_insights` - AI-generated suggestions and warnings
- `workload_snapshots` - Daily workload analytics
- `chat_messages` - AI chat conversation history

### Autopilot Tables
- `autopilot_settings` - User preferences for AI autopilot
- `morning_briefings` - Daily AI-generated briefings
- `auto_schedule` - AI-scheduled tasks with time blocks
- `autopilot_adjustments` - AI adjustment logs

### Integration Tables
- `integrations` - OAuth tokens for Notion and Google

## 🎯 Usage Limits

### Free Plan
- 30 AI task extractions/month
- 10 saved boards
- Basic features

### Pro Plan ($9/month)
- Unlimited AI extractions
- Unlimited saved boards
- All AI features (Chat, Autopilot, Workload Management)
- Google Calendar sync
- Notion integration
- Priority support

## 📝 Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm test:coverage    # Generate coverage report
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy

### Environment Variables for Production

Update these in production:
- `NEXT_PUBLIC_APP_URL` → Your domain
- `GOOGLE_REDIRECT_URI` → `https://yourdomain.com/api/google/callback`
- `NOTION_REDIRECT_URI` → `https://yourdomain.com/api/integrations/notion/callback`
- `STRIPE_WEBHOOK_SECRET` → Production webhook secret

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Groq](https://groq.com/) - Fast AI inference
- [Stripe](https://stripe.com/) - Payment processing
- [ShadCN UI](https://ui.shadcn.com/) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📞 Support

- 📧 Email: support@kanbi.app
- 🐛 Issues: [GitHub Issues](https://github.com/MuhammadTanveerAbbas/kanbi/issues)
- 📖 Docs: See [MANUAL-SETUP.md](MANUAL-SETUP.md) for detailed setup guide

---

**⭐ Star this repo if you find it useful!**

Made with ⚡ by [Muhammad Tanveer Abbas](https://github.com/MuhammadTanveerAbbas)

# KANBI 📋

AI-Powered Task Management SaaS Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

SaaS platform that transforms notes into organized Kanban boards using AI. Includes authentication, cloud storage, premium subscriptions, and analytics dashboard.

## Features

- 🤖 **AI Task Extraction** - Google Gemini & Groq AI parse notes and extract tasks
- 📋 **Kanban Board** - Drag-and-drop task management
- 🔐 **Authentication** - Supabase Auth with email/password
- 💾 **Cloud Storage** - PostgreSQL database for secure storage
- 💳 **Stripe Payments** - Premium subscriptions ($20/month)
- 📊 **Analytics Dashboard** - Usage stats and activity tracking
- 📥 **Export** - Save boards as JSON
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Quick Start

```bash
git clone https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard.git
cd kanbi-ActionBoard
npm install
npm run dev
```

## Environment Setup

### 1. Supabase (Required)

1. Create a project at [Supabase](https://supabase.com)
2. Run the SQL from `supabase/schema.sql` in SQL Editor
3. Get your project URL and anon key from Settings → API
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. AI Keys (Required)

The app supports both Groq and Google Gemini AI:

**Google Gemini**
```bash
GOOGLE_GENKIT_API_KEY=your_gemini_api_key
```

**Groq**
```bash
GROQ_API_KEY=your_groq_api_key
```

### 3. Stripe (Optional)

```bash
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_ID=your_price_id
```

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Google Gemini & Groq AI
- Stripe Payments
- ShadCN UI, Framer Motion

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx       # Overview with stats & analytics
│   │   ├── board/         # Kanban board page
│   │   ├── saved/         # Saved boards management
│   │   └── settings/      # User settings & billing
│   ├── login/             # Login page
│   ├── sign-up/           # Signup page
│   ├── pricing/           # Pricing page
│   └── api/               # API routes
│       ├── ai/            # AI extraction endpoints
│       ├── saved/         # Board CRUD operations
│       ├── subscription/  # Stripe subscription
│       └── checkout/      # Stripe checkout
├── components/
│   ├── action-board.tsx   # Main Kanban board
│   ├── board/             # Board components
│   ├── landing/           # Landing page sections
│   └── ui/                # ShadCN UI components
└── lib/
    ├── supabase/          # Supabase client & auth
    ├── stripe/            # Stripe configuration
    └── dashboard-types.ts # TypeScript types
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

1. Deploy to Vercel
2. Add environment variables
3. Set up Stripe webhook
4. Run Supabase migrations

## License

MIT License

---

⭐ Star this repo if you find it useful!
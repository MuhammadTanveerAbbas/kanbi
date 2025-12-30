# KANBI 📋

AI-Powered Kanban Task Management

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**[Live Demo →](https://kanbi.vercel.app)**

## Overview

Transform messy notes into organized Kanban boards. No signup required, all data stays local.

## Features

- 🤖 **AI Task Extraction** - Optional Google AI (Gemini) integration
- 📋 **Kanban Board** - Drag-and-drop task management
- 🎯 **Priority Levels** - Low, Medium, High, Urgent
- 📅 **Due Dates** - Track deadlines with overdue indicators
- 🔍 **Search & Filter** - Find tasks by text or priority
- 🗑️ **Bulk Actions** - Clear completed tasks at once
- 💾 **Local Storage** - Data stays in your browser
- 📱 **Responsive** - Works on all devices
- 📊 **Progress Tracking** - Visual completion statistics
- 📥 **Export/Import** - Backup and restore as JSON

## Quick Start

```bash
git clone https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard.git
cd kanbi-ActionBoard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI Setup (Optional)

Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey):

```bash
# .env.local
GOOGLE_GENKIT_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
GOOGLE_API_KEY=your_api_key_here
NEXT_PUBLIC_USE_AI=true
```

Without AI, manual task creation works perfectly.

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- ShadCN UI
- Google AI (Gemini)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MuhammadTanveerAbbas/kanbi-ActionBoard)

## License

MIT License - See [LICENSE](LICENSE) file

## Author

Built by [Muhammad Tanveer Abbas](https://muhammadtanveerabbas.vercel.app/)

---

⭐ Star this repo if you find it useful!

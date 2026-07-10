# YordamchiAI

> An AI-powered education platform (LMS) for students, teachers, and institutions — with a built-in AI assistant, vision (image/PDF) analysis, attendance, lessons, tests, achievements, and premium subscriptions.

**Live:** https://yordamchi-ai-alpha.vercel.app

---

## ✨ Features

- **AI Assistant** — streaming chat, file uploads (image / PDF / DOCX / audio), conversation export, pin & rename, powered by Gemini via Supabase Edge Functions.
- **AI Vision** — analyze images and PDFs (solve problems, explain, translate).
- **Three role dashboards** — Student, Teacher, Admin (46 pages total).
- **Learning tools** — lessons, tests, assignments, attendance calendar, achievements, certificates, leaderboard, progress analytics.
- **Premium subscriptions** — plans, manual payment + receipt upload, admin approval flow.
- **Internationalization** — Uzbek 🇺🇿 / Russian 🇷🇺 / English 🇬🇧.
- **Dark-first premium UI** — glassmorphism design system, Framer Motion animations, responsive, reduced-motion aware.

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 (Rolldown) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Backend | Supabase (Postgres + Auth + Storage + RLS + Edge Functions) |
| AI | Google Gemini (via Supabase Edge Functions) |
| Routing | React Router v7 (lazy routes + code splitting) |
| Docs/Export | jsPDF, docx (lazy-loaded), KaTeX, highlight.js |
| Hosting | Vercel |

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- (For AI features) a Google Gemini API key

### Install & run

```bash
git clone <repo-url>
cd "Yordamchi AI"
npm install

cp .env.example .env      # then fill in your values
npm run dev               # http://localhost:5173
```

### Environment variables
Frontend needs these in `.env` (see [`.env.example`](.env.example) for full docs):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Edge-Function secrets are **server-side only** — set them with the Supabase CLI, never in `.env`:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc`) + production build |
| `npm run preview` | Preview the production build locally |

## 🗄️ Backend (Supabase)

- **Migrations:** `supabase/migrations/` (26 migrations — schema, RLS policies, RPCs, premium/payment tables).
- **Edge Functions:** `supabase/functions/`
  - `ai-chat` — streaming AI assistant (caller auth + rate limit + error sanitization)
  - `ai-vision` — image/PDF analysis
  - `admin-users` — admin user management

```bash
supabase link --project-ref <your-ref>
supabase db push                       # apply migrations
supabase functions deploy ai-chat      # deploy an edge function
```

## 📁 Project Structure

```
src/
  ai-brain/        AI intelligence, memory, vision pipeline
  app/             App shell, router, providers
  components/      Reusable UI (ai, dashboard, identity, layout, student, …)
  contexts/        Auth, Profile, Language (i18n)
  hooks/           useAuth, useProfile, useVoiceInput, …
  layouts/         Role layouts (Main, Student, Teacher, Admin)
  lib/             supabase client, logger, utils
  pages/           Route pages (auth, public, student, teacher, admin)
  routes/          PATHS constants + lazy route tables
  services/        Data access layer (Supabase queries + business logic)
  styles/          Global CSS + design tokens
  types/           Shared TypeScript types
```

## 🏗️ Architecture Notes

- **Data layer:** all Supabase access goes through `src/services/*` — pages/components never query the DB directly.
- **Security:** Row-Level Security (RLS) on all tables; Edge Functions verify the caller and sanitize errors; no secrets in the client bundle.
- **Performance:** route-level `React.lazy` + Suspense; vendor chunks (`vendor-react`, `vendor-motion`); heavy libraries (jsPDF) are dynamically imported on demand.
- **Logging:** use `logger` from `@/lib/logger` (dev-only console output; single hook point for wiring an error monitor such as Sentry).
- **i18n:** `LanguageContext` holds a strictly-typed `Translations` map with `uz` / `ru` / `en` — adding a key requires updating the type and all three locales.

## 📄 License

Proprietary — all rights reserved.

# WHAT — AI Agency Platform

> Scale your business with AI employees. Deploy intelligent agents for marketing, sales, support, and operations.

## Features

- **10 Full Pages**: Landing, Auth, Dashboard, AI Chat, Agents, Workflows, CRM, Analytics, Files, Team, Settings, Admin
- **Multi-Model AI**: GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro — switch per conversation
- **6 Specialized Agents**: Marketing, Sales, Copywriting, Research, Support, Social Media
- **Workflow Automation**: Visual drag-and-drop builder with triggers and AI actions
- **CRM**: Kanban pipeline, leads table, deal tracking
- **Analytics Dashboard**: Revenue charts, AI usage breakdown, cost tracking
- **File Uploads**: Drag & drop with AI document analysis
- **Team Management**: Invite members, set roles, manage permissions
- **Settings**: API key management, billing, notifications, 2FA, sessions
- **Admin Panel**: User management, system logs, revenue analytics
- **Mobile Responsive**: Bottom nav, drawer sidebar, responsive grids

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, CSS Variables (glassmorphism)
- **AI**: OpenAI API, Anthropic Claude API, Google Gemini API
- **Database**: Supabase PostgreSQL with Row Level Security
- **Payments**: Stripe subscriptions + webhooks
- **Auth**: Supabase Auth (email + social)
- **Deployment**: Vercel

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd what-ai-platform
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase, Stripe, and AI API keys

# 3. Set up database
# Paste supabase/schema.sql into Supabase SQL Editor and run

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables. The app works without any env vars in demo mode — users can bring their own API keys in Settings.

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL Editor. This creates:
- `profiles`, `teams`, `team_members`, `team_invites`
- `ai_agents`, `conversations`, `messages`, `ai_memories`
- `files`, `workflows`, `workflow_runs`
- `crm_contacts`, `crm_leads`, `crm_deals`, `crm_activities`
- `subscriptions`, `usage_analytics`, `notifications`, `api_keys`
- Row Level Security policies for all tables
- Auto-triggers for profile creation and `updated_at`
- Vector embeddings support via `pgvector`

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# or via CLI: vercel env add OPENAI_API_KEY
```

## Pricing Plans

| Feature | Free | Pro ($49/mo) | Agency ($149/mo) |
|---------|------|--------------|------------------|
| AI Agents | 3 | 15 | Unlimited |
| Messages | 100/mo | Unlimited | Unlimited |
| Team Members | 1 | 5 | 25 |
| File Uploads | — | 10GB | Unlimited |
| Workflows | — | ✓ | ✓ |
| Analytics | Basic | Full | Full |
| Admin Panel | — | — | ✓ |
| White Label | — | — | ✓ |

## API Routes

- `POST /api/ai/chat` — Multi-model AI chat (OpenAI/Anthropic/Gemini streaming)
- `POST /api/files/upload` — File upload with validation
- `POST /api/stripe/checkout` — Create Stripe checkout session
- `POST /api/stripe/webhook` — Handle Stripe events

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Entry point
│   ├── layout.tsx            # Root layout + metadata
│   ├── globals.css           # Complete design system
│   └── api/
│       ├── ai/chat/          # Multi-provider AI streaming
│       ├── files/upload/     # File processing
│       └── stripe/           # Payment flows
├── components/
│   └── WhatApp.tsx           # Complete platform (2,184 lines)
├── lib/
│   ├── supabase.ts           # DB client + types
│   └── utils.ts              # Helpers
├── types/
│   └── index.ts              # TypeScript definitions
└── supabase/
    └── schema.sql            # Complete DB schema
```

## Scaling Recommendations

1. **Caching**: Add Redis (Upstash) for AI response caching
2. **Edge**: Deploy AI routes on Vercel Edge for global low latency  
3. **Vector DB**: Enable pgvector for RAG / document search
4. **Queue**: Add BullMQ for workflow execution
5. **CDN**: Use Supabase Storage CDN for file serving
6. **Monitoring**: Add PostHog for analytics + Sentry for errors

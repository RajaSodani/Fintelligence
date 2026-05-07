# Fintelligence

> Your money. Finally intelligent.

A dark luxury fintech SaaS platform powered by multi-agent AI for personal finance, portfolio tracking, and investment research.

## Tech Stack

- **Vite + React 18 + TypeScript** — fast, type-safe frontend
- **Tailwind CSS v3** — utility-first styling with custom design tokens
- **React Router v6** — client-side routing
- **Clerk** — authentication (sign-in, sign-up, session management)
- **Axios** — API communication
- **Recharts** — charts and visualizations
- **Lucide React** — icon library
- **clsx + tailwind-merge** — conditional class utilities

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your Clerk publishable key from clerk.com

# 3. Start dev server
npm run dev
```

## Features

### Phase 1 (current)
- **Landing page** — hero, feature grid, stats strip
- **Dashboard** — net worth stats, spending donut chart, transactions, AI chat
- **Research** — ticker search, 4 AI agent pipeline (News / Financials / Sentiment / Thesis), investment report
- **Market** — portfolio hero banner, holdings table with sparklines, watchlist, price alerts
- **Settings** — profile, connected accounts, subscription management

## Screenshots

Adding soon

## Design System

Dark luxury aesthetic with CSS custom properties:

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#080a10` | Page background |
| `--bg2` | `#0e1018` | Card background |
| `--green` | `#00e87a` | Primary accent |
| `--amber` | `#f5a623` | Warning / neutral |
| `--red` | `#ff4d6a` | Negative / danger |
| `--blue` | `#4d9fff` | Info / watchlist |

Fonts: **Syne** (headings) · **DM Sans** (body) · **DM Mono** (numbers/tickers)

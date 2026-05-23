# Poker Host

A full-featured poker tournament management app. Run tournaments from your phone, let players and spectators follow along in real time — no accounts required for anyone but the host.

## Features

- **Live clock** — wall-clock based countdown that stays in sync across all devices; survives page refresh, tab switch, and device sleep
- **Multi-table support** — balanced seating assignment, automatic rebalancing, and table breaking
- **Player management** — register, eliminate, rebuy, add-on, and move players inline
- **Spectator view** — shareable public link with live clock, blinds, and prize pool; TV layout for big screens
- **Undo system** — undo the last action (elimination, rebuy, level advance) within 30 seconds
- **Blind structure builder** — drag-to-reorder levels, preset structures (standard / turbo / deep / casual), break support
- **Payout calculator** — automatic ITM spots and percentages based on entries; chop deal support
- **Zero friction for players** — no sign-up needed; only the host authenticates

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma v7 |
| Auth | NextAuth v5 + [Resend](https://resend.com) email magic link |
| UI | shadcn/ui + Tailwind CSS v4 |
| State | Zustand + SWR (2s polling) |
| Forms | React Hook Form + Zod |
| Drag & drop | @dnd-kit |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) database (free tier works)
- A [Resend](https://resend.com) account for magic link emails (free tier works)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
# Neon database
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"

# Resend (email magic link)
AUTH_RESEND_KEY="re_..."
EMAIL_FROM="onboarding@resend.dev"
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your email.

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables from your `.env` to Vercel's project settings — update `AUTH_URL` to your production URL
4. Deploy

## Project Structure

```
app/
  api/              # Route handlers (tournaments, players, tables, spectator)
  auth/             # Sign-in and verify pages
  dashboard/        # Host control panel and tournament wizard
  spectator/        # Public spectator view and TV layout
components/
  tournament/       # Clock, player list, table map, undo bar
lib/
  clock.ts          # Wall-clock math
  payout.ts         # Payout calculation
  seating.ts        # Balanced seat assignment
  rebalance.ts      # Table rebalancing algorithm
  blind-presets.ts  # Standard / turbo / deep / casual presets
prisma/
  schema.prisma     # Full database schema
```

# Next Auction

A full-stack real-time car auction platform built with Next.js 15, Prisma, and Socket.io.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google OAuth + credentials) |
| Identity verification | MitID via Criipto / Idura broker |
| Real-time | Socket.io |
| Email | Resend |
| Image upload | Cloudinary |
| Error tracking | Sentry |
| Payments | Stripe (integrated) |
| Styling | Tailwind CSS |
| Testing | Vitest |

## Features

- **Real-time bidding** — Socket.io pushes live price updates and notifications to all connected users
- **Race condition protection** — Prisma `$transaction` with Serializable isolation + optimistic locking ensures two concurrent bids can never both win
- **Rate limiting** — 5 bids / 10 s per user; 10 messages / 60 s per user (sliding-window, in-memory)
- **Auction status automation** — Cron endpoint sets `completed`, `cancelled`, or `reserve_not_met` when auctions end
- **Owner auction cancellation** — Car owners can cancel their active listing from the detail page
- **Like system** — Users can like/unlike listings; heart icon on each card persists across sessions
- **Email verification** — Credential signups receive a verification link; Google signups are auto-verified
- **MitID verification** — Danish users can verify their identity via MitID (separate from login)
- **Structured logging** — JSON logs on every bid attempt/rejection/success; unexpected errors captured to Sentry
- **Notifications** — Bell icon with unread count; real-time socket push for new bids, outbids, and messages
- **Messaging** — Buyer ↔ seller chat per listing, with email fallback via Resend
- **Admin panel** — Dashboard with stats, car management, and per-listing bid history
- **Error boundaries** — `app/error.tsx` and `app/global-error.tsx` show recovery UI instead of a white screen
- **CI** — GitHub Actions runs lint + tests + type check on every push and PR

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in the values in .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See [.env.example](.env.example) for the full list. Required variables:

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
EMAIL_FROM
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CRON_SECRET              # protects /api/cron/auction-status
GOOGLE_CLIENT_ID         # Google OAuth
GOOGLE_CLIENT_SECRET
CRIIPTO_CLIENT_ID        # MitID via Idura broker (optional)
CRIIPTO_CLIENT_SECRET
CRIIPTO_DOMAIN
NEXT_PUBLIC_SENTRY_DSN   # optional — app works without it
SENTRY_DSN               # optional
```

## Project Structure

```
next-auction/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth + credentials register + email verify
│   │   ├── bids/          # Place & list bids
│   │   ├── cars/          # CRUD + like + status
│   │   ├── messages/      # Chat + notifications
│   │   ├── upload/        # Cloudinary image upload
│   │   ├── admin/         # Admin stats & car management
│   │   ├── mitid/         # MitID OIDC start + callback
│   │   └── cron/          # Auction status updater
│   ├── cars/              # Browse & detail pages
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Sign in / sign up / verify-email pages
│   ├── mitid-verified/    # MitID verification result page
│   ├── error.tsx          # App-level error boundary
│   ├── global-error.tsx   # Root layout error boundary
│   └── not-found.tsx      # 404 page
├── components/
│   ├── Header.tsx          # Nav + bell notifications + user menu + MitID link
│   ├── CarCard.tsx         # Listing card with time remaining + like button
│   ├── LikeButton.tsx      # Heart toggle, calls like API
│   ├── BiddingSection.tsx  # Live bid form + bid history
│   ├── MessagesModal.tsx   # Chat modal
│   ├── MessageSeller.tsx   # Message seller button
│   └── PageLayout.tsx      # Shared layout wrapper
├── lib/
│   ├── bid-validation.ts   # Pure bid business rules (testable)
│   ├── bid-error.ts        # Typed error class for bid rejections
│   ├── rate-limit.ts       # Sliding-window rate limiter
│   ├── logger.ts           # Structured JSON logger + Sentry
│   ├── socket-server.ts    # Socket.io singleton
│   ├── email.ts            # Resend email helpers
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   └── zod.ts              # Input validation schemas
├── pages/api/
│   └── socketio.ts         # Socket.io handler (Pages Router)
├── prisma/
│   └── schema.prisma
├── types/
│   ├── car.ts              # Car / owner / bidder TypeScript interfaces
│   └── next-auth.d.ts      # Session / JWT type augmentation
├── .github/workflows/
│   └── ci.yml              # Lint + test + type check
└── .env.example
```

## API Routes

| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/cars` | List / create listings |
| GET/PATCH/DELETE | `/api/cars/[id]` | Single car |
| POST/DELETE | `/api/cars/[id]/like` | Toggle like |
| PATCH | `/api/cars/[id]/status` | Update auction status (owner/admin) |
| GET/POST | `/api/bids` | List / place bids |
| GET/POST | `/api/messages` | Fetch / send messages |
| GET/PATCH | `/api/messages/notifications` | Read notifications / mark read |
| POST | `/api/upload` | Upload images to Cloudinary |
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/cars/[id]` | Admin car detail with bid stats |
| GET | `/api/auth/verify-email` | Verify email token from link |
| GET | `/api/mitid/start` | Start MitID OIDC flow |
| GET | `/api/mitid/callback` | MitID OIDC callback — sets `mitIdVerified` |
| GET | `/api/cron/auction-status` | Update ended auction statuses (cron, secret-protected) |

## Auction Status Logic

The cron endpoint (`/api/cron/auction-status`) runs on ended auctions and applies these rules:

| Condition | Status set |
|---|---|
| Still running | `active` (untouched) |
| Ended, no bids | `cancelled` |
| Ended, bids exist but highest < reserve | `reserve_not_met` |
| Ended, bids exist and reserve met (or no reserve) | `completed` |

Trigger it on a schedule (e.g. Vercel Cron):

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/auction-status", "schedule": "*/5 * * * *" }]
}
```

## Scripts

```bash
npm run dev          # Start dev server
npm test             # Run unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run lint         # ESLint
```

## Bidding Rules

1. Bid must be strictly higher than the current price
2. Auction must have `active` status and not have passed its end date
3. Owner cannot bid on their own listing
4. Maximum 5 bids per 10 seconds per user
5. Two concurrent bids for the same car are resolved atomically — the first to commit wins, the second receives a 409

## Database Schema

```
User ──< Car ──< Bid
              ──< Message
              ──< Like
User ──< Notification
User ── VerificationToken
```

# Next-Auction AI Coding Agent Instructions

## Project Overview
A real-time car auction platform built with Next.js 16 (App Router), TypeScript, Prisma ORM (PostgreSQL), NextAuth.js, Stripe payments, and Socket.IO for real-time bidding.

## Architecture & Key Components

### Data Layer (Prisma)
- **Database**: PostgreSQL via Prisma ORM
- **Schema Location**: [prisma/schema.prisma](../prisma/schema.prisma)
- **Prisma Client**: Singleton instance in [lib/prisma.ts](../lib/prisma.ts) - always import from here, never instantiate directly
- **Models**: 
  - `User` - Authentication (NextAuth) with rating system (avg rating + count)
  - `Car` - Auction listings with `status`, `currentPrice`, `reservePrice`, and `winnerBidId`
  - `Bid` - Bidding history with indexes on `carId`, `bidderId`, `createdAt`
  - `Notification` - User notifications with `read` status and `type` categorization
  - `Rating` - User ratings with unique constraint on `[ratedUserId, raterUserId, carId]`
  - `Account`, `Session`, `VerificationToken` - NextAuth adapter models

### Authentication
- **Provider**: NextAuth.js v4 with Prisma adapter
- **Auth Methods**: Credentials (bcryptjs) + Google OAuth (`googleId` field)
- **User Model**: Supports both email/password and OAuth providers

### Integrations
- **Payments**: Stripe (both `stripe` server SDK and `@stripe/stripe-js` client SDK)
- **Email**: Resend for transactional emails
- **Real-time**: Socket.IO for live auction bidding (both server and client packages)

### Frontend Architecture
- **Framework**: Next.js 16 with App Router (React 19)
- **Styling**: Tailwind CSS v4 with custom font variables (Geist Sans/Mono)
- **Path Aliases**: Use `@/*` for root imports (configured in tsconfig.json)

## Critical Workflows

### Database Management
```bash
# Always run after schema changes
npx prisma migrate dev --name <descriptive_name>

# Generate Prisma Client (automatically runs after migrate)
npx prisma generate

# View data in browser
npx prisma studio
```

### Development
```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint (next/core-web-vitals + typescript config)
```

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- NextAuth configuration (secret, providers)
- Stripe API keys (likely `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- Resend API key for emails
- Google OAuth credentials (optional)

## Project-Specific Conventions

### Prisma Client Usage
Always import the singleton instance:
```typescript
import { prisma } from '@/lib/prisma'
```
Never create new `PrismaClient()` instances - the singleton handles HMR in dev.

### Database Indexes
Critical indexes are defined for query performance:
- Bids: `carId`, `bidderId`, `createdAt` (for bid history queries)
- Cars: `ownerId`, `status`, `auctionEndDate` (for auction filtering/sorting)
- Notifications: `userId`, `read`, `createdAt` (for user notification feeds)

### Bidding System
- `Car.currentPrice` tracks the highest bid
- `Car.winnerBidId` references the winning bid (nullable until auction ends)
- `Car.reservePrice` is optional - auction may not meet reserve
- Cascade deletes configured: deleting a Car removes all related Bids

### Rating System
- Users have computed `rating` (average) and `ratingCount` fields
- Ratings have unique constraint preventing duplicate ratings for same car/user pair
- Bidirectional relations: `RatingsReceived` vs `RatingsGiven`

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to project root
- React 19 JSX runtime (`react-jsx`)
- Target ES2017 for compatibility

## Socket.IO Real-time Pattern
Both `socket.io` (server) and `socket.io-client` are installed - implement real-time bid updates using Socket.IO events. Structure server handlers carefully to broadcast bid updates to all connected clients watching a specific car auction.

## Testing & Quality
- ESLint configured with Next.js recommended rules
- Flat config format (eslint.config.mjs)
- Custom ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Common Patterns

### NextAuth User Relations
When querying users, consider including related data:
```typescript
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    cars: true,      // User's listings
    bids: true,      // Bidding history
    ratings: true,   // Ratings received
  }
})
```

### Auction Status Flow
Car status values: `"active"` → `"completed"` / `"cancelled"`
Always check `auctionEndDate` against current time for expired auctions.

## Key Files Reference
- [lib/prisma.ts](../lib/prisma.ts) - Database client singleton
- [prisma/schema.prisma](../prisma/schema.prisma) - Complete data model
- [app/layout.tsx](../app/layout.tsx) - Root layout with font configuration
- [package.json](../package.json) - Dependencies and scripts
- [prisma.config.ts](../prisma.config.ts) - Prisma configuration (auto-generated)

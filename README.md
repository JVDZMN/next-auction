# Next.js Auction Platform

A full-stack car auction platform with real-time bidding capabilities.

## ✅ What's Been Set Up

### Backend & Database
- **Prisma ORM** with PostgreSQL (Database created: `auction_db`)
- **Database Models**: User, Car, Bid, Notification, Rating, Account, Session
- **NextAuth.js** with Google OAuth configured
- **Email Notifications** via Resend API

### API Routes Created
- `/api/auth/[...nextauth]` - Authentication (Google OAuth)
- `/api/cars` - GET (list cars) & POST (create auction)
- `/api/bids` - POST (place bids with validation)

### Features Implemented

#### ✅ Bidding System
- Users can place bids on active auctions
- **Validation**: Owner cannot bid on own car
- **Validation**: Bid must be higher than current price
- **Validation**: Auction must be active and not expired

#### ✅ Email Notifications
- Car owner receives email when bid is placed
- Previous highest bidder receives "outbid" notification
- All outbid bidders get notified when new higher bid placed

#### ✅ User Profiles
- Rating system (1-5 stars)
- Bid history tracking
- Car listing management

## ��� Next Steps

### To Start Development:
```bash
npm run dev
```

### Still To Build:
1. **Frontend Pages**:
   - Homepage with car listings
   - Car detail page with bidding interface
   - User profile & dashboard
   - Create auction form
   - Authentication pages

2. **WebSocket Integration**:
   - Real-time bid updates
   - Live auction countdown
   - Socket.io server setup

3. **Stripe Payment**:
   - Payment processing for winners
   - Escrow system

4. **Image Upload**:
   - Car photo uploads (Cloudinary/AWS S3)
   - Image gallery

5. **Mobile App** (React Native):
   - Separate project at `/c/Next.JS/next-auction-mobile`

## ��� Project Structure
```
next-auction/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Google OAuth
│   │   ├── bids/                # Bidding endpoints
│   │   └── cars/                # Car auction endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts       # NextAuth config
│   ├── email.ts      # Email notifications
│   └── prisma.ts     # Prisma client
├── prisma/
│   └── schema.prisma # Database schema
├── types/
│   └── next-auth.d.ts
├── .env              # Environment variables (configured)
└── .env.example      # Template
```

## ��� Configuration

All environment variables are set up in `.env`:
- ✅ PostgreSQL connection
- ✅ NextAuth secret
- ✅ Google OAuth credentials
- ✅ Resend API key
- ⚠️  Stripe keys (add your keys)

## ��� Core Auction Rules (Implemented in API)

1. Starting price set by owner
2. Auction duration (4 days configurable)
3. Email notifications to:
   - Car owner (on every bid)
   - All previous bidders when outbid
4. Bidders stop receiving notifications if they don't re-bid
5. Owner cannot bid on own car
6. Bids must be higher than current price

## ��� Database Schema

- **User**: Profile, rating, authentication
- **Car**: Title, description, specs, images, pricing
- **Bid**: Amount, timestamp, relationships
- **Notification**: Type, read status, car reference
- **Rating**: Score, comment, timestamps

Build successful! ✅

import { prisma } from '@/lib/prisma'
import { emitToCar } from '@/lib/socket-server'

/**
 * Updates statuses for all auctions that have passed their deadline.
 * This should be called by the /api/cron/auction-status route.
 */
export async function UpdateAuctionStatus() {
  // 1. Get current time in UTC
  const now = new Date().toISOString();

  // 2. Find all 'active' auctions that have expired
  const expiredAuctions = await prisma.car.findMany({
    where: {
      status: 'active',
      auctionEndDate: {
        lte: now, // Comparing ISO strings ensures strictly UTC-based DB filtering
      },
    },
    include: {
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
      },
    },
  });

  if (expiredAuctions.length === 0) return { updated: 0 };

  const results = [];

  // Use a standard loop or Promise.allSettled so one failure doesn't crash the whole cron
  for (const car of expiredAuctions) {
    try {
      const highestBid = car.bids[0];
      let newStatus: 'completed' | 'reserve_not_met' | 'cancelled';

      if (!highestBid) {
        newStatus = 'cancelled';
      } else if (car.reservePrice && highestBid.amount < car.reservePrice) {
        newStatus = 'reserve_not_met';
      } else {
        newStatus = 'completed';
      }

      const updatedCar = await prisma.car.update({
        where: { id: car.id },
        data: { 
          status: newStatus,
          winnerBidId: highestBid?.id || null,
        },
      });

      // Trigger Pusher side-effect (non-blocking for the DB transaction)
      void emitToCar(car.id, 'auction-ended', {
        status: newStatus,
        winnerId: highestBid?.bidderId || null,
      });

      results.push(updatedCar);
    } catch (error) {
      // Log the specific car ID that failed so the rest of the cron can continue
      console.error(`[UpdateAuctionStatus] Failed to process car ${car.id}:`, error);
      // Optionally report to Sentry
    }
  }

  return { updated: results.length };
}
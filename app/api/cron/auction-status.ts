import util from 'util'

/**
 * This script checks all cars with status 'active' whose auctionEndDate has passed.
 * If the highest bid is below reservePrice (or no bids), sets status to 'reserve_not_met'.
 * If the highest bid is >= reservePrice, sets status to 'completed'.
 */
export async function updateAuctionStatuses() {
  // Dynamically import prisma for ESM compatibility
  const { prisma } = await import('../../../lib/prisma');
  // Find all active cars whose auction has ended
  const endedCars = await prisma.car.findMany({
    where: {
      status: 'active',
      auctionEndDate: { lte: new Date() },
    },
    include: {
      bids: { orderBy: { amount: 'desc' } },
    },
  });

  console.log(`[${new Date().toISOString()}] Found ${endedCars.length} ended active cars.`);

  for (const car of endedCars) {
    const highestBid = car.bids[0];
    if (!highestBid || (car.reservePrice && highestBid.amount < car.reservePrice)) {
      await prisma.car.update({ where: { id: car.id }, data: { status: 'reserve_not_met' } });
      console.log(`Car ${car.id}: reserve_not_met (highestBid: ${highestBid ? highestBid.amount : 'none'}, reserve: ${car.reservePrice})`);
    } else {
      await prisma.car.update({ where: { id: car.id }, data: { status: 'completed', winnerBidId: highestBid.id } });
      console.log(`Car ${car.id}: completed (highestBid: ${highestBid.amount}, reserve: ${car.reservePrice})`);
    }
  }
}



if (require.main === module) {
  (async () => {
    try {
      await updateAuctionStatuses();
      console.log('Auction statuses updated.');
      process.exit(0);
    } catch (err) {
      console.error('Error updating auction statuses:', err);
      try { console.error('JSON:', JSON.stringify(err)); } catch {}
      try { console.error('INSPECT:', util.inspect(err, { depth: 10 })); } catch {}
      process.exit(1);
    }
  })();
}

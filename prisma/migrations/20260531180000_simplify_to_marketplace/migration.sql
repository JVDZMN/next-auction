-- Simplify to marketplace model — remove Stripe fields, simplify status enum

-- Step 1: Migrate any rows with removed enum values to safe defaults
UPDATE "Car" SET status = 'completed' WHERE status IN ('pending_payment', 'confirmed', 'payment_overdue', 'second_chance', 'disputed');
UPDATE "Car" SET status = 'active'    WHERE status = 'relisted';

-- Step 2: Data migration — zero-bid cancelled auctions → no_bid
UPDATE "Car"
SET status = 'no_bid'
WHERE status = 'cancelled'
  AND "winnerBidId" IS NULL
  AND id NOT IN (SELECT DISTINCT "carId" FROM "Bid");

-- Step 3: Recreate the CarStatus enum with only 5 values
ALTER TABLE "Car" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "CarStatus" RENAME TO "CarStatus_old";
CREATE TYPE "CarStatus" AS ENUM ('active', 'completed', 'no_bid', 'reserve_not_met', 'cancelled');
ALTER TABLE "Car" ALTER COLUMN "status" TYPE "CarStatus" USING "status"::text::"CarStatus";
ALTER TABLE "Car" ALTER COLUMN "status" SET DEFAULT 'active'::"CarStatus";
DROP TYPE "CarStatus_old";

-- Step 4: Remove Stripe and payment fields
ALTER TABLE "Car"
  DROP COLUMN IF EXISTS "secondChanceBidId",
  DROP COLUMN IF EXISTS "paymentDeadline",
  DROP COLUMN IF EXISTS "disputeDeadline",
  DROP COLUMN IF EXISTS "stripePaymentId",
  DROP COLUMN IF EXISTS "stripeSessionId",
  DROP COLUMN IF EXISTS "commissionAmount",
  DROP COLUMN IF EXISTS "disputeReason",
  DROP COLUMN IF EXISTS "disputeResolvedAt",
  DROP COLUMN IF EXISTS "disputeResolvedBy";

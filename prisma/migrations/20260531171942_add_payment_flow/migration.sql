-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CarStatus" ADD VALUE 'pending_payment';
ALTER TYPE "CarStatus" ADD VALUE 'confirmed';
ALTER TYPE "CarStatus" ADD VALUE 'payment_overdue';
ALTER TYPE "CarStatus" ADD VALUE 'second_chance';
ALTER TYPE "CarStatus" ADD VALUE 'disputed';
ALTER TYPE "CarStatus" ADD VALUE 'no_bid';
ALTER TYPE "CarStatus" ADD VALUE 'relisted';

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "commissionAmount" DOUBLE PRECISION,
ADD COLUMN     "disputeDeadline" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputeResolvedAt" TIMESTAMP(3),
ADD COLUMN     "disputeResolvedBy" TEXT,
ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "secondChanceBidId" TEXT,
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

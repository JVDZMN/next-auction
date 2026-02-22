/*
  Warnings:

  - The `status` column on the `Car` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('active', 'completed', 'cancelled', 'paused', 'reserve_not_met', 'pending_payment', 'pending_approval');

-- AlterTable
ALTER TABLE "Car" DROP COLUMN "status",
ADD COLUMN     "status" "CarStatus" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

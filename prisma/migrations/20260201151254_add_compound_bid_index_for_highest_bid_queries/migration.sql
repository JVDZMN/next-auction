-- CreateIndex
CREATE INDEX "Bid_carId_amount_createdAt_idx" ON "Bid"("carId", "amount" DESC, "createdAt" DESC);

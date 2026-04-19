-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "antiSnipingMinutes" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "auctionStartDate" TIMESTAMP(3),
ADD COLUMN     "bidIncrement" DOUBLE PRECISION,
ADD COLUMN     "inspectionReportUrl" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceHistoryUrls" TEXT[],
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vin" TEXT;

-- AlterTable
ALTER TABLE "Like" ADD COLUMN     "notifyNearClose" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sellerVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProxyBid" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProxyBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "brand" TEXT,
    "maxPrice" DOUBLE PRECISION,
    "minYear" INTEGER,
    "fuel" TEXT,
    "notifyNewListing" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProxyBid_carId_idx" ON "ProxyBid"("carId");

-- CreateIndex
CREATE INDEX "ProxyBid_bidderId_idx" ON "ProxyBid"("bidderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProxyBid_carId_bidderId_key" ON "ProxyBid"("carId", "bidderId");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- AddForeignKey
ALTER TABLE "ProxyBid" ADD CONSTRAINT "ProxyBid_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyBid" ADD CONSTRAINT "ProxyBid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

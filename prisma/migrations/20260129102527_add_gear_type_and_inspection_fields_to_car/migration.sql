-- CreateEnum
CREATE TYPE "GearType" AS ENUM ('Manual', 'Automatic');

-- CreateEnum
CREATE TYPE "Geartype" AS ENUM ('Manual', 'Automatic');

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "gearType" "GearType",
ADD COLUMN     "lastInspection" TIMESTAMP(3),
ADD COLUMN     "nextInspection" TIMESTAMP(3);

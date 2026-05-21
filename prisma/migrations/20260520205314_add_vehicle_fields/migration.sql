-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "engineSize" DOUBLE PRECISION,
ADD COLUMN     "firstRegistration" TIMESTAMP(3),
ADD COLUMN     "lastInspectionKm" INTEGER,
ADD COLUMN     "licensePlate" TEXT,
ADD COLUMN     "seats" INTEGER,
ADD COLUMN     "subModel" TEXT,
ADD COLUMN     "use" TEXT,
ADD COLUMN     "variant" TEXT,
ADD COLUMN     "weight" INTEGER;

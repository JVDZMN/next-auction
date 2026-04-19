-- Remove rating system: drop Rating table, remove rating/ratingCount from User,
-- remove euroStandard/addressLine from Car, drop EuroStandard enum

ALTER TABLE "User" DROP COLUMN IF EXISTS "rating";
ALTER TABLE "User" DROP COLUMN IF EXISTS "ratingCount";

ALTER TABLE "Car" DROP COLUMN IF EXISTS "euroStandard";
ALTER TABLE "Car" DROP COLUMN IF EXISTS "addressLine";

DROP TABLE IF EXISTS "Rating";

DROP TYPE IF EXISTS "EuroStandard";

-- Agent professional profile + workspace subscription.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planStatus" TEXT NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planTier" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);

-- Keep existing agents (demo inventory) usable after this change.
UPDATE "User"
SET "planStatus" = 'ACTIVE',
    "planTier" = COALESCE("planTier", 'PREMIUM')
WHERE role IN ('AGENT', 'ADMIN')
  AND "planStatus" = 'UNPAID';

-- Personal-account intent (buy / sell / both) collected at signup.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "intent" TEXT;

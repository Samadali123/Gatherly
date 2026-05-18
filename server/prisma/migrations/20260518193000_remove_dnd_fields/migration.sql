ALTER TABLE "users"
  DROP COLUMN IF EXISTS "dndEnabled",
  DROP COLUMN IF EXISTS "dndSchedule",
  DROP COLUMN IF EXISTS "dndPeriod",
  DROP COLUMN IF EXISTS "dndWhitelist";

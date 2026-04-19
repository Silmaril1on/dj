-- ============================================================
-- IMAGE_URL MIGRATION: text → jsonb for all four entity tables
-- Run this in Supabase SQL Editor (or via psql)
-- ============================================================
-- STEP 1 — Add new image_url JSONB column alongside old column.
--          This is safe to run while the app is live.
-- ============================================================

ALTER TABLE artists  ADD COLUMN IF NOT EXISTS image_url JSONB;
ALTER TABLE clubs    ADD COLUMN IF NOT EXISTS image_url JSONB;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS image_url JSONB;
ALTER TABLE events   ADD COLUMN IF NOT EXISTS image_url JSONB;

-- ============================================================
-- STEP 2 — Seed image_url from the existing text columns so
--          that existing records immediately work with the new
--          resolveImage() helper (which falls back to .lg).
--          All three keys point to the original URL until the
--          backfill route creates proper sm/md variants.
-- ============================================================

UPDATE artists
SET image_url = jsonb_build_object(
  'sm', artist_image,
  'md', artist_image,
  'lg', artist_image
)
WHERE artist_image IS NOT NULL
  AND image_url IS NULL;

UPDATE clubs
SET image_url = jsonb_build_object(
  'sm', club_image,
  'md', club_image,
  'lg', club_image
)
WHERE club_image IS NOT NULL
  AND image_url IS NULL;

UPDATE festivals
SET image_url = jsonb_build_object(
  'sm', poster,
  'md', poster,
  'lg', poster
)
WHERE poster IS NOT NULL
  AND image_url IS NULL;

UPDATE events
SET image_url = jsonb_build_object(
  'sm', event_image,
  'md', event_image,
  'lg', event_image
)
WHERE event_image IS NOT NULL
  AND image_url IS NULL;

-- ============================================================
-- STEP 3 — (Optional) Add GIN index for fast JSONB lookups.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_artists_image_url   ON artists   USING GIN (image_url);
CREATE INDEX IF NOT EXISTS idx_clubs_image_url     ON clubs     USING GIN (image_url);
CREATE INDEX IF NOT EXISTS idx_festivals_image_url ON festivals USING GIN (image_url);
CREATE INDEX IF NOT EXISTS idx_events_image_url    ON events    USING GIN (image_url);

-- ============================================================
-- STEP 4 — After running POST /api/admin/backfill-images
--          to generate real sm/md/lg variants for every row,
--          drop the old columns:
--
--   ALTER TABLE artists   DROP COLUMN artist_image;
--   ALTER TABLE clubs     DROP COLUMN club_image;
--   ALTER TABLE festivals DROP COLUMN poster;
--   ALTER TABLE events    DROP COLUMN event_image;
--
-- ⚠️  Do NOT run Step 4 until:
--     a) The backfill route has been called and completed (GET /api/admin/backfill-images
--        shows legacyStringUrl: 0 for all types), AND
--     b) The new application code is fully deployed.
-- ============================================================

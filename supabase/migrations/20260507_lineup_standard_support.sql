-- Step 1: Add festival_id column to festival_lineup (nullable FK)
ALTER TABLE festival_lineup
  ADD COLUMN IF NOT EXISTS festival_id UUID REFERENCES festivals(id) ON DELETE CASCADE;

-- Step 2: Backfill festival_id for ALL existing entries (enhanced + virtual standard)
--         Both types have a stage_id at this point, so join works for all
UPDATE festival_lineup fl
SET festival_id = fs.festival_id
FROM festival_stages fs
WHERE fl.stage_id = fs.id
  AND fl.festival_id IS NULL;

-- Step 3: Make stage_id nullable (MUST happen before we set any to NULL)
ALTER TABLE festival_lineup ALTER COLUMN stage_id DROP NOT NULL;

-- Step 4: Detach rows linked to virtual standard stages (stage_name='', stage_order=-1)
--         These already have festival_id backfilled from Step 2
UPDATE festival_lineup
SET stage_id = NULL
WHERE stage_id IN (
  SELECT id FROM festival_stages WHERE stage_name = '' AND stage_order = -1
);

-- Step 5: Delete the virtual standard stage rows (FK rows are already unlinked)
DELETE FROM festival_stages WHERE stage_name = '' AND stage_order = -1;

-- Step 6: Index for fast standard artist lookups by festival
CREATE INDEX IF NOT EXISTS idx_festival_lineup_festival_id_standard
  ON festival_lineup(festival_id)
  WHERE stage_id IS NULL;

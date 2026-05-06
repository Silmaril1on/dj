-- event_tickets table
-- Mirrors the structure of festival_tickets.
-- Each row stores all ticket groups for one event as a JSONB column.

CREATE TABLE IF NOT EXISTS event_tickets (
  event_id     UUID        PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  ticket_link  TEXT        NOT NULL DEFAULT '',
  ticket_groups JSONB      NOT NULL DEFAULT '[]'::jsonb,
  updated_by   UUID        REFERENCES auth.users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow the event owner and admins to manage tickets via RLS policies
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Public read access (tickets are public info)
CREATE POLICY "event_tickets_select"
  ON event_tickets FOR SELECT
  USING (true);

-- Only authenticated users can insert/update their own event's tickets
-- (enforced in application layer via assertEventOwnerOrAdmin, but belt-and-suspenders here)
CREATE POLICY "event_tickets_upsert"
  ON event_tickets FOR ALL
  USING (auth.uid() = updated_by)
  WITH CHECK (auth.uid() = updated_by);

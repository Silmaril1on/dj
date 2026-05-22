-- Function: search_events_by_lineup
-- Returns approved events where any element in the artists text[] column
-- case-insensitively matches the given search term (substring match).
-- This works around PostgREST's lack of support for cast syntax (::) in
-- filter expressions, which causes PGRST100 when using .or('artists::text.ilike...').

CREATE OR REPLACE FUNCTION search_events_by_lineup(search_term text)
RETURNS SETOF events
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM events
  WHERE status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM unnest(artists) AS a(artist_name)
      WHERE lower(a.artist_name) LIKE '%' || lower(search_term) || '%'
    )
  LIMIT 20;
$$;

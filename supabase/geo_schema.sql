-- GeoGuess multiplayer: Supabase Realtime Presence + Broadcast only.
-- No persistent tables needed for the core game — all state lives in the
-- Realtime channel. The schema below is optional for persistent leaderboards.

-- Enable Realtime on these tables if you use them:

-- Persistent game rooms (optional — for room discovery / replay history)
CREATE TABLE IF NOT EXISTS geo_rooms (
  code        VARCHAR(6)  PRIMARY KEY,
  host_id     TEXT        NOT NULL,
  seed        BIGINT      NOT NULL,
  round_count INTEGER     NOT NULL DEFAULT 5,
  timer_sec   INTEGER     NOT NULL DEFAULT 90,
  status      TEXT        NOT NULL DEFAULT 'lobby', -- lobby | playing | finished
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Persistent high scores (optional)
CREATE TABLE IF NOT EXISTS geo_scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code   VARCHAR(6)  REFERENCES geo_rooms(code) ON DELETE CASCADE,
  player_id   TEXT        NOT NULL,
  player_name TEXT        NOT NULL,
  player_avatar TEXT      NOT NULL,
  total_score INTEGER     NOT NULL DEFAULT 0,
  round_count INTEGER     NOT NULL DEFAULT 5,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (allow public read for leaderboards)
ALTER TABLE geo_rooms  ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read geo_rooms"  ON geo_rooms  FOR SELECT USING (true);
CREATE POLICY "Public read geo_scores" ON geo_scores FOR SELECT USING (true);
CREATE POLICY "Public insert geo_rooms"  ON geo_rooms  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert geo_scores" ON geo_scores FOR INSERT WITH CHECK (true);

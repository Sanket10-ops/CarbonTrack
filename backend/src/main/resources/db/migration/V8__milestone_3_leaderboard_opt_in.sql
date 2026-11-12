-- Leaderboard sharing is independent from aggregate community benchmarking.
ALTER TABLE users
    ADD COLUMN leaderboard_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

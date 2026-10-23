-- Write counters for the public API, one row per visitor and fixed time window.
-- `key` is a SHA-256 hash of the visitor IP salted with the window, so raw IPs are never stored
-- and keys cannot be linked across windows. Old windows are pruned by the API.
CREATE TABLE rate_limits (
  key          TEXT    NOT NULL,
  window_start INTEGER NOT NULL, -- unix seconds
  count        INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX idx_rate_limits_window ON rate_limits (window_start);

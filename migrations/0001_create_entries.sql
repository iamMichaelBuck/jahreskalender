CREATE TABLE entries (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL,
  start_date TEXT NOT NULL, -- YYYY-MM-DD, inclusive
  end_date   TEXT NOT NULL, -- YYYY-MM-DD, inclusive
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_entries_range ON entries (start_date, end_date);

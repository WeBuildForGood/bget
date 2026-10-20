-- Build For Good — Mailing list sends table
-- Created: 2026-10-18
-- Tracks email sends for analytics and debugging

-- Table to track mailing list sends (for logging, analytics)
CREATE TABLE IF NOT EXISTS mail_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER REFERENCES subscribers(id),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE INDEX IF NOT EXISTS idx_mail_sends_subscriber ON mail_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_mail_sends_sent_at ON mail_sends(sent_at);

-- Index for faster lookups by subscriber (to see what emails they received)
CREATE INDEX IF NOT EXISTS idx_mail_sends_subscriber_date ON mail_sends(subscriber_id, sent_at);
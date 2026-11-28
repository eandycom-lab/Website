PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  domain_category TEXT NOT NULL,
  website TEXT NOT NULL,
  repository TEXT NOT NULL,
  source_owner TEXT NOT NULL,
  source_repo TEXT NOT NULL,
  include_prereleases INTEGER NOT NULL DEFAULT 0 CHECK (include_prereleases IN (0, 1)),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'github_releases',
  source_release_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  version TEXT NOT NULL,
  release_name TEXT,
  source_url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  prerelease INTEGER NOT NULL DEFAULT 0 CHECK (prerelease IN (0, 1)),
  draft INTEGER NOT NULL DEFAULT 0 CHECK (draft IN (0, 1)),
  content_hash TEXT NOT NULL,
  raw_notes TEXT NOT NULL,
  is_baseline INTEGER NOT NULL DEFAULT 0 CHECK (is_baseline IN (0, 1)),
  processing_status TEXT NOT NULL DEFAULT 'pending_analysis'
    CHECK (processing_status IN ('pending_analysis', 'needs_review', 'approved', 'rejected', 'error')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (application_id, source_release_id)
);

CREATE TABLE IF NOT EXISTS release_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  title_de TEXT NOT NULL,
  summary_de TEXT NOT NULL,
  changes_json TEXT NOT NULL DEFAULT '[]',
  upgrade_notes_json TEXT NOT NULL DEFAULT '[]',
  security_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (security_status IN ('confirmed', 'not_reported', 'unknown')),
  breaking_changes_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (breaking_changes_status IN ('confirmed', 'not_reported', 'unknown')),
  event_types_json TEXT NOT NULL DEFAULT '[]',
  evidence_json TEXT NOT NULL DEFAULT '[]',
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  reviewed_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (release_id, revision)
);

CREATE TABLE IF NOT EXISTS processing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  correlation_id TEXT NOT NULL,
  application_id TEXT,
  stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'warn', 'error')),
  error_code TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_releases_app_status
  ON releases (application_id, processing_status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_summaries_published
  ON release_summaries (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_logs_created
  ON processing_logs (created_at DESC);

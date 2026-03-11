ALTER TABLE profiles ADD COLUMN github_last_synced_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN github_last_synced_at TIMESTAMPTZ;

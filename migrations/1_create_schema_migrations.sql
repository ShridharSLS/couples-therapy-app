-- Migration: 1_create_schema_migrations
-- Description: Creates a table to track applied migrations
-- Date: 2025-05-20

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('1_create_schema_migrations');

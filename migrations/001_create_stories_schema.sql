-- ==============================================================================
-- 24-HOUR STORIES / STATUS PLATFORM SCHEMA MIGRATION
-- Migration: 001_create_stories_schema.sql
-- Target Engine: PostgreSQL 14+ (Compatible with Amazon RDS / Aurora / Cloud SQL)
-- ==============================================================================

-- Enable UUID extension for robust, non-enumerable primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. STORIES TABLE (Core Entity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stories (
    story_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id VARCHAR(64) NOT NULL,
    media_url TEXT NOT NULL,
    media_type VARCHAR(16) NOT NULL CHECK (media_type IN ('image', 'video')),
    duration_seconds NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (duration_seconds > 0 AND duration_seconds <= 60.00),
    caption VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Partial composite index for fast feed aggregation & active story lookup
-- Filters out soft-deleted and expired records efficiently
CREATE INDEX IF NOT EXISTS idx_stories_author_active 
ON stories (author_id, expires_at DESC) 
WHERE is_deleted = FALSE;

-- Index for expiration cleanup / retention sweeps
CREATE INDEX IF NOT EXISTS idx_stories_expiration_sweep
ON stories (expires_at)
WHERE is_deleted = FALSE;

-- Index for author time-series listing
CREATE INDEX IF NOT EXISTS idx_stories_author_created
ON stories (author_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 2. STORY VIEWS TABLE (Unique View Receipts & Analytics)
-- Composite Primary Key ensures idempotent write deduplication
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS story_views (
    story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    viewer_id VARCHAR(64) NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_platform VARCHAR(32) DEFAULT 'mobile_app',
    PRIMARY KEY (story_id, viewer_id)
);

-- Index for analytical queries and author view rosters
CREATE INDEX IF NOT EXISTS idx_story_views_time 
ON story_views (story_id, viewed_at DESC);

-- ------------------------------------------------------------------------------
-- 3. STORY LIKES / REACTIONS TABLE
-- Composite Primary Key guarantees 1 active reaction per user per story
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS story_likes (
    story_id UUID NOT NULL REFERENCES stories(story_id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    reaction_type VARCHAR(32) NOT NULL DEFAULT 'like',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story_created 
ON story_likes (story_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. RETENTION & CLEANUP AUTOMATION (pg_cron or Scheduled Daemon)
-- Soft-deletes or archives expired stories older than 24 hours
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_expired_stories()
RETURNS VOID AS $$
BEGIN
    -- Flag expired stories as deleted
    UPDATE stories
    SET is_deleted = TRUE
    WHERE expires_at < NOW() AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- If pg_cron is enabled in the database cluster:
-- SELECT cron.schedule('purge-stories-every-10-mins', '*/10 * * * *', 'SELECT purge_expired_stories();');

-- ------------------------------------------------------------------------------
-- 5. S3 LIFECYCLE RULE CONFIGURATION (Reference CloudFormation / Terraform)
-- ------------------------------------------------------------------------------
/*
Terraform AWS S3 Bucket Lifecycle Configuration:
resource "aws_s3_bucket_lifecycle_configuration" "stories_bucket_lifecycle" {
  bucket = aws_s3_bucket.stories_media.id

  rule {
    id     = "expire-stories-after-24h"
    status = "Enabled"

    filter {
      prefix = "stories/"
    }

    expiration {
      days = 1 # Automatically expires and deletes underlying blobs after 24 hours
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
*/

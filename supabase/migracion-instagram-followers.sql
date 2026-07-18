-- Migration: Add Instagram and Followers fields to ambassador_profiles
-- Description: Adds instagram_link and followers_range columns to store ambassador's Instagram URL and follower metrics
-- Date: 2025-01-13

ALTER TABLE ambassador_profiles ADD COLUMN IF NOT EXISTS instagram_link text;
ALTER TABLE ambassador_profiles ADD COLUMN IF NOT EXISTS followers_range text;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_instagram_link 
ON ambassador_profiles(instagram_link) 
WHERE instagram_link IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_followers_range 
ON ambassador_profiles(followers_range) 
WHERE followers_range IS NOT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN ambassador_profiles.instagram_link IS 'Instagram profile URL of the ambassador';
COMMENT ON COLUMN ambassador_profiles.followers_range IS 'Range of Instagram followers (e.g., 1K - 5K, 50K - 100K)';

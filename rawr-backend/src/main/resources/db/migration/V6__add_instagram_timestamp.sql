-- Track which articles came from Instagram so the cron import is idempotent.
ALTER TABLE articles ADD COLUMN instagram_timestamp VARCHAR(40);

-- Partial unique index so non-IG articles (NULL) are unconstrained.
CREATE UNIQUE INDEX idx_articles_instagram_timestamp
    ON articles(instagram_timestamp)
    WHERE instagram_timestamp IS NOT NULL;

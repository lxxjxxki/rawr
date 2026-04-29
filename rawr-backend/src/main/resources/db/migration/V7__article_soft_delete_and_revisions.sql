-- Soft-delete column on articles + revisions table for recovery.

ALTER TABLE articles ADD COLUMN deleted_at TIMESTAMP;

-- Allow same slug to be reused after a soft delete. The original
-- unique constraint is auto-named articles_slug_key by Hibernate/JPA.
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_slug_key;
CREATE UNIQUE INDEX uniq_articles_slug_active
    ON articles(slug)
    WHERE deleted_at IS NULL;

CREATE TABLE article_revisions (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    cover_image VARCHAR(500),
    category VARCHAR(20) NOT NULL,
    saved_by UUID NOT NULL,
    saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_article_revisions_article FOREIGN KEY (article_id)
        REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX idx_article_revisions_article_saved_at
    ON article_revisions(article_id, saved_at DESC);

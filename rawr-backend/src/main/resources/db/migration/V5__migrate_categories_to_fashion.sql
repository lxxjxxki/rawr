-- Move all MUSIC/ART/ETC articles to FASHION category
UPDATE articles SET category = 'FASHION' WHERE category IN ('MUSIC', 'ART', 'ETC');

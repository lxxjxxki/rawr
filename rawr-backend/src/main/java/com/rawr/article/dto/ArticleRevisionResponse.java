package com.rawr.article.dto;

import com.rawr.article.ArticleRevision;
import com.rawr.article.Category;

import java.time.LocalDateTime;
import java.util.UUID;

public record ArticleRevisionResponse(
        UUID id,
        UUID articleId,
        String title,
        String slug,
        String content,
        String coverImage,
        Category category,
        UUID savedBy,
        LocalDateTime savedAt
) {
    public static ArticleRevisionResponse from(ArticleRevision r) {
        return new ArticleRevisionResponse(
                r.getId(),
                r.getArticleId(),
                r.getTitle(),
                r.getSlug(),
                r.getContent(),
                r.getCoverImage(),
                r.getCategory(),
                r.getSavedBy(),
                r.getSavedAt()
        );
    }
}

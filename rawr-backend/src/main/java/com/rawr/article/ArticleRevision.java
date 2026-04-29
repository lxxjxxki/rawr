package com.rawr.article;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "article_revisions")
public class ArticleRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "article_id", nullable = false)
    private UUID articleId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(name = "saved_by", nullable = false)
    private UUID savedBy;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt = LocalDateTime.now();

    protected ArticleRevision() {}

    public ArticleRevision(Article article, UUID savedBy) {
        this.articleId = article.getId();
        this.title = article.getTitle();
        this.slug = article.getSlug();
        this.content = article.getContent();
        this.coverImage = article.getCoverImage();
        this.category = article.getCategory();
        this.savedBy = savedBy;
    }

    public UUID getId() { return id; }
    public UUID getArticleId() { return articleId; }
    public String getTitle() { return title; }
    public String getSlug() { return slug; }
    public String getContent() { return content; }
    public String getCoverImage() { return coverImage; }
    public Category getCategory() { return category; }
    public UUID getSavedBy() { return savedBy; }
    public LocalDateTime getSavedAt() { return savedAt; }
}

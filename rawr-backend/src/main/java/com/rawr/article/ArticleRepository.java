package com.rawr.article;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Article> findByInstagramTimestamp(String instagramTimestamp);
    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);
    Page<Article> findByStatusAndCategory(ArticleStatus status, Category category, Pageable pageable);
    List<Article> findByStatus(ArticleStatus status);

    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(a.content) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY a.publishedAt DESC")
    Page<Article> search(@Param("q") String q, Pageable pageable);
}
